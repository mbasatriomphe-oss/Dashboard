<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class lots extends Model
{
    use HasFactory;

    protected $table = 'lots';

    protected $fillable = [
        'numero_lot',
        'id_produit',
        'id_variante_produit',
        'id_approvisionnement',
        'id_ligne_approvisionnement',
        'quantite_initial',
        'date_reception',
        'date_expiration',
        'id_devise',
    ];

    protected $casts = [
        'date_reception' => 'date',
        'date_expiration' => 'date',
    ];

    public function produit()
    {
        return $this->belongsTo(produits::class, 'id_produit');
    }

    public function approvisionnement()
    {
        return $this->belongsTo(approvisionnements::class, 'id_approvisionnement');
    }

    public function ligneApprovisionnement()
    {
        return $this->belongsTo(ligne_approvisionnements::class, 'id_ligne_approvisionnement');
    }

    public function devise()
    {
        return $this->belongsTo(devise::class, 'id_devise');
    }

    public function mouvementsStock()
    {
        return $this->hasMany(mouvements_stock_fifos::class, 'id_lot');
    }
}
