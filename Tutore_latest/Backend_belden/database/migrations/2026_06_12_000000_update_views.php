<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Recreate views without ORDER BY clauses
        DB::statement('CREATE OR REPLACE VIEW v_chiffre_affaires AS
            SELECT 
                DATE(v.date) as date_vente,
                MONTH(v.date) as mois,
                YEAR(v.date) as annee,
                d.code as devise_code,
                COUNT(DISTINCT v.id) as nombre_ventes,
                SUM(lv.quantite) as quantite_totale,
                SUM(lv.quantite * lv.prix_vente) as montant_total
            FROM ventes v
            INNER JOIN ligne_ventes lv ON lv.id_vente = v.id
            INNER JOIN devises d ON d.id = lv.id_devise
            GROUP BY DATE(v.date), MONTH(v.date), YEAR(v.date), d.code');

        DB::statement('CREATE OR REPLACE VIEW v_top_produits AS
            SELECT 
                p.id,
                p.code,
                p.nom,
                c.nom as categorie_nom,
                COUNT(DISTINCT lv.id_vente) as nombre_ventes,
                SUM(lv.quantite) as quantite_vendue,
                SUM(lv.quantite * lv.prix_vente) as chiffre_affaires
            FROM produits p
            INNER JOIN ligne_ventes lv ON lv.id_produit = p.id
            INNER JOIN categories c ON c.id = p.categorie_id
            GROUP BY p.id, p.code, p.nom, c.nom');

        DB::statement('CREATE OR REPLACE VIEW v_lots_expiration AS
            SELECT 
                l.id,
                l.numero_lot,
                p.nom as produit_nom,
                l.quantite_initial,
                (l.quantite_initial - COALESCE((
                    SELECT SUM(quantite) 
                    FROM mouvements_stock_fifos mf
                    WHERE mf.id_lot = l.id 
                    AND mf.type_mouvement = "sortie"
                ), 0)) as quantite_restante,
                l.date_reception,
                l.date_expiration,
                DATEDIFF(l.date_expiration, CURDATE()) as jours_restants,
                CASE 
                    WHEN l.date_expiration < CURDATE() THEN "Expiré"
                    WHEN DATEDIFF(l.date_expiration, CURDATE()) <= 30 THEN "Expire bientôt"
                    ELSE "Valide"
                END as statut_expiration
            FROM lots l
            INNER JOIN produits p ON p.id = l.id_produit
            HAVING quantite_restante > 0');

        DB::statement('CREATE OR REPLACE VIEW v_marge_produit AS
            SELECT 
                p.id,
                p.code,
                p.nom,
                AVG(lv.prix_vente) as prix_vente_moyen,
                AVG(la.prix_unitaire) as prix_achat_moyen,
                (AVG(lv.prix_vente) - AVG(la.prix_unitaire)) as marge_unitaire,
                ((AVG(lv.prix_vente) - AVG(la.prix_unitaire)) / AVG(lv.prix_vente) * 100) as marge_pourcentage
            FROM produits p
            INNER JOIN ligne_ventes lv ON lv.id_produit = p.id
            INNER JOIN lots l ON l.id_produit = p.id
            INNER JOIN ligne_approvisionnements la ON la.id = l.id_ligne_approvisionnement
            GROUP BY p.id, p.code, p.nom
            HAVING marge_pourcentage IS NOT NULL');

        DB::statement('CREATE OR REPLACE VIEW v_mouvements_caisse AS
            SELECT 
                tc.id,
                d.code as devise_code,
                tc.type,
                tc.montant,
                tc.reference_type,
                tc.reference_id,
                tc.description,
                tc.solde_avant,
                tc.solde_apres,
                tc.created_at as date_mouvement,
                u.nom as utilisateur_nom,
                u.prenom as utilisateur_prenom
            FROM transactions_caisses tc
            INNER JOIN caisses c ON c.id = tc.id_caisse
            INNER JOIN devises d ON d.id = c.id_devise
            LEFT JOIN users u ON u.id = tc.created_by');
    }

    public function down(): void
    {
        DB::statement('DROP VIEW IF EXISTS v_chiffre_affaires');
        DB::statement('DROP VIEW IF EXISTS v_top_produits');
        DB::statement('DROP VIEW IF EXISTS v_lots_expiration');
        DB::statement('DROP VIEW IF EXISTS v_marge_produit');
        DB::statement('DROP VIEW IF EXISTS v_mouvements_caisse');
    }
};
