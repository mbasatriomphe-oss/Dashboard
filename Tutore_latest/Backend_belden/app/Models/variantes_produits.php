<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class variantes_produits extends Model
{
    use HasFactory;

    protected $table = 'variantes_produits';

    protected $fillable = [
        'produit_id',
        'code_sku',
        'combinaison',
        'prix_ht',
        'prix_ttc',
        'quantite_stock',
        'quantite_reservee',
        'seuil_alerte',
        'code_barre',
        'poids_kg',
        'date_creation',
        'date_modification',
    ];

    protected $casts = [
        'combinaison' => 'array',
        'prix_ht' => 'decimal:2',
        'prix_ttc' => 'decimal:2',
        'date_creation' => 'datetime',
        'date_modification' => 'datetime',
    ];

    public function produit()
    {
        return $this->belongsTo(produits::class, 'produit_id');
    }

    public function lots()
    {
        return $this->hasMany(lots::class, 'id_variante_produit');
    }

    public function lignesVente()
    {
        return $this->hasMany(ligne_ventes::class, 'id_variante_produit');
    }

    public function lignesApprovisionnement()
    {
        return $this->hasMany(ligne_approvisionnements::class, 'id_variante_produit');
    }

    public function lignesRetour()
    {
        return $this->hasMany(ligne_retours::class, 'id_variante_produit');
    }
}
