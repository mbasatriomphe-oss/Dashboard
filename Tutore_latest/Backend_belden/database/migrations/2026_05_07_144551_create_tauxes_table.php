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
        Schema::create('taux', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('devise_source');
            $table->unsignedBigInteger('devise_but');
            $table->decimal('valeur', 20, 8);
            $table->date('date_effet');
            $table->enum('statut',['actif','inactif'])->default('inactif');
            $table->foreign('devise_source')->references('id')->on('devises');
            $table->foreign('devise_but')->references('id')->on('devises');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('taux');
    }
};
