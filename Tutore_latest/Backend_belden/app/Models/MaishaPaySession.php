<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MaishaPaySession extends Model
{
    use HasFactory;

    protected $table = 'maishapay_sessions';

    protected $fillable = [
        'reference',
        'mode_paiement',
        'devise_vente_id',
        'payment_amount',
        'currency_code',
        'frais_transaction',
        'payload',
        'status',
        'created_by',
        'vente_id',
    ];

    protected $casts = [
        'payload' => 'array',
        'payment_amount' => 'decimal:8',
        'frais_transaction' => 'decimal:8',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
