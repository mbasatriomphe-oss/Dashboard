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
        Schema::create('variantes_produits', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('produit_id');
            $table->string('code_sku', 255)->unique();
            $table->json('combinaison'); // Stockage des attributs en JSON
            
            // Prix et stocks
            $table->decimal('prix_ht', 10, 2)->default(0.00);
            $table->decimal('prix_ttc', 10, 2)->default(0.00);
            $table->integer('quantite_stock')->default(0);
            $table->integer('quantite_reservee')->default(0);
            $table->integer('seuil_alerte')->default(5);
            
            // Informations complémentaires
            $table->string('code_barre', 100)->nullable();
            $table->decimal('poids_kg', 8, 3)->nullable();
            
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_modification')->useCurrent()->useCurrentOnUpdate();
            
            // Clé étrangère
            $table->foreign('produit_id')
                  ->references('id')
                  ->on('produits')
                  ->onDelete('cascade');
            
            // Index pour les recherches fréquentes
            $table->index('produit_id');
            $table->index('code_sku');
            $table->index('quantite_stock');
            
            // (Optionnel) Index sur les champs JSON pour MySQL 8.0+
            // $table->index([DB::raw('(combinaison->>"$.Couleur")')], 'idx_couleur');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('variantes_produits');
    }
};
