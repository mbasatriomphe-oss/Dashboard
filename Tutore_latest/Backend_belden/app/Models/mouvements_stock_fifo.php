<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class mouvements_stock_fifo extends Model
{
    use HasFactory;

    protected $table = 'mouvements_stock_fifos';

    protected $fillable = [
        'id_lot',
        'id_ligne_vente',
        'id_ligne_retour',
        'type_mouvement',
        'quantite',
        'quantite_restante_avant',
        'quantite_restante_apres',
        'date_mouvement',
    ];

    protected $casts = [
        'date_mouvement' => 'date',
    ];
}
