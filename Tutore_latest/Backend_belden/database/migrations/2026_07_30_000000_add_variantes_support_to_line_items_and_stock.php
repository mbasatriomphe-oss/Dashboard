<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ligne_ventes', function (Blueprint $table) {
            $table->unsignedBigInteger('id_variante_produit')->nullable()->after('id_produit');
            $table->foreign('id_variante_produit')->references('id')->on('variantes_produits')->onDelete('restrict');
            $table->index('id_variante_produit');
        });

        Schema::table('ligne_approvisionnements', function (Blueprint $table) {
            $table->unsignedBigInteger('id_variante_produit')->nullable()->after('id_produit');
            $table->foreign('id_variante_produit')->references('id')->on('variantes_produits')->onDelete('restrict');
            $table->index('id_variante_produit');
        });

        Schema::table('lots', function (Blueprint $table) {
            $table->unsignedBigInteger('id_variante_produit')->nullable()->after('id_produit');
            $table->foreign('id_variante_produit')->references('id')->on('variantes_produits')->onDelete('restrict');
            $table->index('id_variante_produit');
        });

        Schema::table('ligne_retours', function (Blueprint $table) {
            $table->unsignedBigInteger('id_variante_produit')->nullable()->after('id_produit');
            $table->foreign('id_variante_produit')->references('id')->on('variantes_produits')->onDelete('restrict');
            $table->index('id_variante_produit');
        });

        DB::unprepared('DROP TRIGGER IF EXISTS create_lot_after_approvisionnement');
        DB::unprepared('
            CREATE TRIGGER create_lot_after_approvisionnement
            AFTER INSERT ON ligne_approvisionnements
            FOR EACH ROW
            BEGIN
                DECLARE lot_number VARCHAR(50);
                DECLARE appro_date DATE;

                SELECT date INTO appro_date
                FROM approvisionnements
                WHERE id = NEW.id_approvisionnement;

                SET lot_number = CONCAT(
                    "LOT-",
                    DATE_FORMAT(appro_date, "%Y%m%d"),
                    "-",
                    LPAD(NEW.id_produit, 5, "0"),
                    "-",
                    LPAD(FLOOR(RAND() * 10000), 4, "0")
                );

                INSERT INTO lots (
                    numero_lot,
                    id_produit,
                    id_approvisionnement,
                    id_ligne_approvisionnement,
                    id_variante_produit,
                    quantite_initial,
                    date_reception,
                    id_devise,
                    created_at,
                    updated_at
                ) VALUES (
                    lot_number,
                    NEW.id_produit,
                    NEW.id_approvisionnement,
                    NEW.id,
                    NEW.id_variante_produit,
                    NEW.quantite,
                    appro_date,
                    NEW.id_devise,
                    NOW(),
                    NOW()
                );

                INSERT INTO mouvements_stock_fifos (
                    id_lot,
                    type_mouvement,
                    quantite,
                    quantite_restante_avant,
                    quantite_restante_apres,
                    date_mouvement,
                    created_at
                ) VALUES (
                    LAST_INSERT_ID(),
                    "entree",
                    NEW.quantite,
                    0,
                    NEW.quantite,
                    appro_date,
                    NOW()
                );
            END
        ');

        DB::unprepared('DROP TRIGGER IF EXISTS update_stock_after_vente_insert');
        DB::unprepared('
            CREATE TRIGGER update_stock_after_vente_insert
            AFTER INSERT ON ligne_ventes
            FOR EACH ROW
            BEGIN
                DECLARE quantite_restante INT;
                DECLARE lot_id INT;
                DECLARE quantite_lot INT;
                DECLARE done INT DEFAULT FALSE;

                DECLARE cur_lots CURSOR FOR
                    SELECT id, quantite_initial - COALESCE((
                        SELECT SUM(quantite)
                        FROM mouvements_stock_fifos
                        WHERE id_lot = lots.id
                        AND type_mouvement = "sortie"
                    ), 0) as disponible
                    FROM lots
                    WHERE id_produit = NEW.id_produit
                    AND (
                        (NEW.id_variante_produit IS NULL AND id_variante_produit IS NULL)
                        OR (NEW.id_variante_produit IS NOT NULL AND id_variante_produit = NEW.id_variante_produit)
                    )
                    ORDER BY date_reception ASC;

                DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

                SET quantite_restante = NEW.quantite;

                OPEN cur_lots;

                lire_loop: LOOP
                    FETCH cur_lots INTO lot_id, quantite_lot;
                    IF done OR quantite_restante <= 0 THEN
                        LEAVE lire_loop;
                    END IF;

                    IF quantite_lot >= quantite_restante THEN
                        INSERT INTO mouvements_stock_fifos (
                            id_lot, id_ligne_vente, type_mouvement,
                            quantite, quantite_restante_avant,
                            quantite_restante_apres, date_mouvement, created_at
                        ) VALUES (
                            lot_id, NEW.id, "sortie",
                            quantite_restante, quantite_lot,
                            quantite_lot - quantite_restante, CURDATE(), NOW()
                        );
                        SET quantite_restante = 0;
                    ELSE
                        INSERT INTO mouvements_stock_fifos (
                            id_lot, id_ligne_vente, type_mouvement,
                            quantite, quantite_restante_avant,
                            quantite_restante_apres, date_mouvement, created_at
                        ) VALUES (
                            lot_id, NEW.id, "sortie",
                            quantite_lot, quantite_lot, 0, CURDATE(), NOW()
                        );
                        SET quantite_restante = quantite_restante - quantite_lot;
                    END IF;
                END LOOP;

                CLOSE cur_lots;

                IF quantite_restante > 0 THEN
                    SIGNAL SQLSTATE "45000"
                    SET MESSAGE_TEXT = "Stock insuffisant pour cette vente";
                END IF;
            END
        ');

        DB::statement('DROP VIEW IF EXISTS v_stock_disponible_variantes');
        DB::statement('
            CREATE OR REPLACE VIEW v_stock_disponible_variantes AS
            SELECT
                p.id AS produit_id,
                p.code AS produit_code,
                p.nom AS produit_nom,
                u.nom AS unite_nom,
                u.symbole AS unite_symbole,
                vp.id AS id_variante_produit,
                vp.code_sku,
                vp.combinaison,
                COALESCE(SUM(l.quantite_initial - COALESCE((
                    SELECT SUM(quantite)
                    FROM mouvements_stock_fifos mf
                    WHERE mf.id_lot = l.id
                    AND mf.type_mouvement = "sortie"
                ), 0)), 0) AS stock_actuel
            FROM produits p
            LEFT JOIN unites u ON u.id = p.unite_id
            LEFT JOIN lots l ON l.id_produit = p.id AND l.id_variante_produit IS NOT NULL
            LEFT JOIN variantes_produits vp ON vp.id = l.id_variante_produit
            GROUP BY
                p.id,
                p.code,
                p.nom,
                u.nom,
                u.symbole,
                vp.id,
                vp.code_sku,
                vp.combinaison
        ');
    }

    public function down(): void
    {
        DB::statement('DROP VIEW IF EXISTS v_stock_disponible_variantes');
        DB::unprepared('DROP TRIGGER IF EXISTS update_stock_after_vente_insert');
        DB::unprepared('DROP TRIGGER IF EXISTS create_lot_after_approvisionnement');

        Schema::table('ligne_retours', function (Blueprint $table) {
            $table->dropForeign(['id_variante_produit']);
            $table->dropIndex(['id_variante_produit']);
            $table->dropColumn('id_variante_produit');
        });

        Schema::table('lots', function (Blueprint $table) {
            $table->dropForeign(['id_variante_produit']);
            $table->dropIndex(['id_variante_produit']);
            $table->dropColumn('id_variante_produit');
        });

        Schema::table('ligne_approvisionnements', function (Blueprint $table) {
            $table->dropForeign(['id_variante_produit']);
            $table->dropIndex(['id_variante_produit']);
            $table->dropColumn('id_variante_produit');
        });

        Schema::table('ligne_ventes', function (Blueprint $table) {
            $table->dropForeign(['id_variante_produit']);
            $table->dropIndex(['id_variante_produit']);
            $table->dropColumn('id_variante_produit');
        });
    }
};
