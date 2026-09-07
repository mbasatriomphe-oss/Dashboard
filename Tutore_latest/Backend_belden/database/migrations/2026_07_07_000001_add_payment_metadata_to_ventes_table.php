<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ventes', function (Blueprint $table) {
            $table->string('mode_paiement', 20)->default('cash')->after('statut_paiement');
            $table->boolean('paiement_en_ligne')->default(false)->after('mode_paiement');
            $table->decimal('frais_transaction', 12, 2)->default(0)->after('montant_paye');
        });
    }

    public function down(): void
    {
        Schema::table('ventes', function (Blueprint $table) {
            $table->dropColumn(['mode_paiement', 'paiement_en_ligne', 'frais_transaction']);
        });
    }
};
