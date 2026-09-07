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
        Schema::create('retours', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->date('date_retour');
            $table->unsignedBigInteger('id_vente');
            $table->unsignedBigInteger('id_client');
            $table->unsignedBigInteger('id_vendeur');
            $table->text('motif')->nullable();
            $table->foreign('id_vente')->references('id')->on('ventes');
            $table->foreign('id_client')->references('id')->on('clients');
            $table->foreign('id_vendeur')->references('id')->on('vendeurs');
            $table->text('commentaire')->nullable();
            $table->timestamps();

            
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('retours');
    }
};
