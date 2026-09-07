<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ligne_ventes extends Model
{
    use HasFactory;

    protected $table = 'ligne_ventes';

    protected $fillable = [
        'id_vente',
        'id_produit',
        'id_variante_produit',
        'quantite',
        'prix_vente',
        'id_devise',
    ];

    protected $casts = [
        'prix_vente' => 'decimal:8',
    ];

    public function vente()
    {
        return $this->belongsTo(ventes::class, 'id_vente');
    }

    public function produit()
    {
        return $this->belongsTo(produits::class, 'id_produit');
    }

    public function devise()
    {
        return $this->belongsTo(devise::class, 'id_devise');
    }

    public function mouvementsStock()
    {
        return $this->hasMany(mouvements_stock_fifos::class, 'id_ligne_vente');
    }
}
