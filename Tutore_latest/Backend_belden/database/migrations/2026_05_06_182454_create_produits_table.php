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
        Schema::create('produits', function (Blueprint $table) {
            $table->id();
            // creer les champs pour la table produits avec le champ code ,nom,description,photo,id_unite,id_devise,
            $table->string('code', 50)->unique();
            $table->string('nom', 100);
            $table->text('description')->nullable();
            $table->string('photo')->nullable();
            $table->unsignedBigInteger('unite_id');
            $table->unsignedBigInteger('categorie_id');
            $table->foreign('unite_id')->references('id')->on('unites');
            $table->foreign('categorie_id')->references('id')->on('categories');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('produits');
    }
};
