<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ventes', function (Blueprint $table) {
            $table->unsignedBigInteger('devise_vente_id')->nullable()->after('id_client');
            $table->decimal('montant_total', 20, 8)->default(0)->after('devise_vente_id');
            $table->decimal('montant_paye', 20, 8)->default(0)->after('montant_total');
            $table->decimal('reste_a_payer', 20, 8)->default(0)->after('montant_paye');
            $table->string('statut_paiement', 20)->default('payee')->after('reste_a_payer');

            $table->foreign('devise_vente_id')->references('id')->on('devises')->nullOnDelete();
            $table->index(['id_client', 'reste_a_payer']);
            $table->index(['statut_paiement']);
        });
    }

    public function down(): void
    {
        Schema::table('ventes', function (Blueprint $table) {
            $table->dropForeign(['devise_vente_id']);
            $table->dropIndex(['id_client', 'reste_a_payer']);
            $table->dropIndex(['statut_paiement']);
            $table->dropColumn(['devise_vente_id', 'montant_total', 'montant_paye', 'reste_a_payer', 'statut_paiement']);
        });
    }
};