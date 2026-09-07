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
        Schema::create('ligne_approvisionnements', function (Blueprint $table) {
            //cree les champs pour la table ligne_approvisionnements avec le champ id_approvisionnement,id_produit,quantite,prix_unitaire,prix_vente et id_devise
            $table->id();
            $table->unsignedBigInteger('id_approvisionnement');
            $table->unsignedBigInteger('id_produit');
            $table->integer('quantite');
            $table->decimal('prix_unitaire', 20, 8);
            $table->decimal('prix_vente', 20, 8)->nullable();
            $table->unsignedBigInteger('id_devise');
            $table->foreign('id_approvisionnement')->references('id')->on('approvisionnements');
            $table->foreign('id_produit')->references('id')->on('produits');
            $table->foreign('id_devise')->references('id')->on('devises');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ligne_approvisionnements');
    }
};
