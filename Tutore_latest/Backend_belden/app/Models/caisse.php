<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class caisse extends Model
{
    use HasFactory;

    protected $table = 'caisses';

    protected $fillable = [
        'id_devise',
        'solde',
    ];

    protected $casts = [
        'solde' => 'decimal:8',
    ];

    public function devise()
    {
        return $this->belongsTo(devise::class, 'id_devise');
    }

    public function transactions()
    {
        return $this->hasMany(transactions_caisses::class, 'id_caisse');
    }
}
