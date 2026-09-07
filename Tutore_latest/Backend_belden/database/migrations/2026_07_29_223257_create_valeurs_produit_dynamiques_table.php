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
        Schema::create('valeurs_produit_dynamiques', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('produit_id');
            $table->unsignedBigInteger('attribut_template_id');
            $table->string('valeur', 255);
            
            // Un produit ne peut pas avoir 2 fois la même valeur pour le même attribut
            $table->unique(['produit_id', 'attribut_template_id', 'valeur']);
            
            // Clés étrangères
            $table->foreign('produit_id')
                  ->references('id')
                  ->on('produits')
                  ->onDelete('cascade');
                  
            $table->foreign('attribut_template_id')
                  ->references('id')
                  ->on('attributs_template')
                  ->onDelete('restrict'); // On empêche la suppression d'un template utilisé
            
            // Index
            $table->index('produit_id');
            $table->index('attribut_template_id');
        
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('valeurs_produit_dynamiques');
    }
};
