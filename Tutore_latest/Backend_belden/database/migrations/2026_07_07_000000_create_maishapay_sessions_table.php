<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maishapay_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->string('mode_paiement')->default('card');
            $table->unsignedBigInteger('devise_vente_id')->nullable();
            $table->string('currency_code')->nullable();
            $table->decimal('payment_amount', 12, 2);
            $table->decimal('frais_transaction', 12, 2)->default(0);
            $table->json('payload');
            $table->string('status')->default('pending');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('vente_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maishapay_sessions');
    }
};
