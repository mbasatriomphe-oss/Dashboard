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
         Schema::create('lots', function (Blueprint $table) {
            $table->id();
            $table->string('numero_lot', 50)->unique();
            $table->unsignedBigInteger('id_produit');
            $table->unsignedBigInteger('id_approvisionnement');
            $table->unsignedBigInteger('id_ligne_approvisionnement');
            $table->integer('quantite_initial');
            $table->date('date_reception');
            $table->date('date_expiration')->nullable();
            $table->unsignedBigInteger('id_devise');
            
            $table->foreign('id_produit')->references('id')->on('produits');
            $table->foreign('id_approvisionnement')->references('id')->on('approvisionnements');
            $table->foreign('id_ligne_approvisionnement')->references('id')->on('ligne_approvisionnements');
            $table->foreign('id_devise')->references('id')->on('devises');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lots');
    }
};
