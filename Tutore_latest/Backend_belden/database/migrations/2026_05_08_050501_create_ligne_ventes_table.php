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
        Schema::create('ligne_ventes', function (Blueprint $table) {
            // creer les champs pour la table ligne_ventes avec le champ id_vente,id_produit,quantite,prix_vente id_devise;
            $table->id();
            $table->unsignedBigInteger('id_vente');
            $table->unsignedBigInteger('id_produit');
            $table->integer('quantite');
            $table->decimal('prix_vente', 20, 8);
            $table->unsignedBigInteger('id_devise');
            $table->foreign('id_vente')->references('id')->on('ventes');
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
        Schema::dropIfExists('ligne_ventes');
    }
};
