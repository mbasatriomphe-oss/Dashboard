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
        Schema::create('ventes', function (Blueprint $table) {
            // creer les champs pour la table ventes avec le champ code ,date,  ,id_vendeur,id_client;
            $table->id();
            $table->string('code', 50)->unique();
            $table->date('date');
            $table->unsignedBigInteger('id_vendeur');
            $table->unsignedBigInteger('id_client');
            $table->foreign('id_vendeur')->references('id')->on('vendeurs');
            $table->foreign('id_client')->references('id')->on('clients');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ventes');
    }
};
