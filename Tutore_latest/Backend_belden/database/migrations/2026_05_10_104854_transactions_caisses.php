<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions_caisses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_caisse');
            $table->enum('type', ['entree', 'sortie']);
            $table->decimal('montant', 20, 8);
            $table->string('reference_type'); // vente, approvisionnement, retour
            $table->unsignedBigInteger('reference_id');
            $table->text('description')->nullable();
            $table->decimal('solde_avant', 20, 8);
            $table->decimal('solde_apres', 20, 8);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            
            $table->foreign('id_caisse')->references('id')->on('caisses');
            $table->foreign('created_by')->references('id')->on('users');
            $table->index(['reference_type', 'reference_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions_caisses');
    }
};