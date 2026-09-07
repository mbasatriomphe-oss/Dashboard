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
        Schema::create('attributs_templates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('categorie_id');
            $table->unsignedBigInteger('attribut_id');
            
            $table->integer('ordre_affichage')->default(0);
            $table->boolean('obligatoire')->default(true);
            
            // Une catégorie ne peut pas avoir 2 fois le même attribut
            $table->unique(['categorie_id', 'attribut_id']);
            
            // Clés étrangères
            $table->foreign('categorie_id')
                  ->references('id')
                  ->on('categories')
                  ->onDelete('cascade');
                  
            $table->foreign('attribut_id')
                  ->references('id')
                  ->on('attributs')
                  ->onDelete('cascade');
            
            // Index pour accélérer les recherches
            $table->index('categorie_id');
            $table->index('attribut_id');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attributs_templates');
    }
};
