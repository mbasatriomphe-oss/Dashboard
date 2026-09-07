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
        Schema::create('vendeurs', function (Blueprint $table) {
            $table->id();
            // creer les champs pour la table vendeurs avec le champ code ,nom,prenom,email,telephone,adresse
            $table->string('nom', 100);
            $table->string('prenom', 100);
            $table->string('code', 50)->unique();
            $table->string('email')->unique();
            $table->string('telephone', 20)->nullable();
            $table->string('adresse')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vendeurs');
    }
};
