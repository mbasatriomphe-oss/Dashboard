<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class transactions_caisses extends Model
{
    use HasFactory;

    protected $table = 'transactions_caisses';

    protected $fillable = [
        'id_caisse',
        'type',
        'montant',
        'reference_type',
        'reference_id',
        'description',
        'solde_avant',
        'solde_apres',
        'created_by',
    ];

    protected $casts = [
        'montant' => 'decimal:8',
        'solde_avant' => 'decimal:8',
        'solde_apres' => 'decimal:8',
    ];

    public function caisse()
    {
        return $this->belongsTo(caisse::class, 'id_caisse');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
