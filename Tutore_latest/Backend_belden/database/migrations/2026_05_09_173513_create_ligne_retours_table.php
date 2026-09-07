<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ligne_retours', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_retour');
            $table->unsignedBigInteger('id_produit');
            $table->unsignedBigInteger('id_ligne_vente');
            $table->unsignedBigInteger('id_lot');
            $table->integer('quantite_retournee');
            $table->decimal('prix_vente_original', 20, 8); // Prix payé par le client
            $table->decimal('prix_remboursement', 20, 8);  // Prix qu'on va rembourser
            $table->decimal('montant_penalite', 20, 8)->default(0.00); // Pénalité si applicable
            $table->decimal('prix_unitaire_lot', 20, 8); // Prix d'achat du lot
            
            // Raison de la différence de prix
            $table->enum('raison_difference', [
                'aucune',              // Remboursement total
                'usage_client',        // Produit utilisé/endommagé par le client
                'deballage',           // Emballage ouvert
                'decote_naturelle',    // Dépréciation naturelle
                'promotion_remplacement', // Remplacement promotionnel
                'penalite_contrat',    // Pénalité contractuelle
                'autre'
            ])->default('aucune');
            
            $table->text('justification_difference')->nullable();
            
            $table->enum('etat_produit', [
                'bon',           // Bon état, remboursement total possible
                'lege_usage',   // Légèrement utilisé
                'endommage',     // Endommagé mais réparable
                'defectueux',    // Défectueux
                'usage',         // Visiblement utilisé
                'emballage_ouvert' // Emballage ouvert
            ])->default('bon');
            
            $table->boolean('reintegre_stock')->default(false);
            $table->unsignedBigInteger('id_devise');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ligne_retours');
    }
};
