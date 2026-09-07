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
        Schema::create('mouvements_stock_fifos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_lot');
            $table->unsignedBigInteger('id_ligne_vente')->nullable();
            $table->unsignedBigInteger('id_ligne_retour')->nullable();
            $table->enum('type_mouvement', ['entree', 'sortie', 'retour']);
            $table->integer('quantite');
            $table->integer('quantite_restante_avant');
            $table->integer('quantite_restante_apres');
            $table->date('date_mouvement');
            $table->timestamps();
            
            $table->foreign('id_lot')->references('id')->on('lots');
            $table->foreign('id_ligne_vente')->references('id')->on('ligne_ventes');
            $table->foreign('id_ligne_retour')->references('id')->on('ligne_retours');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mouvements_stock_fifos');
    }
};
