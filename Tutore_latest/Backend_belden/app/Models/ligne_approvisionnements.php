<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ligne_approvisionnements extends Model
{
    use HasFactory;

    protected $table = 'ligne_approvisionnements';

    protected $fillable = [
        'id_approvisionnement',
        'id_produit',
        'id_variante_produit',
        'quantite',
        'prix_unitaire',
        'prix_vente',
        'id_devise',
        'paye_par_caisse',
    ];

    protected $casts = [
        'prix_unitaire' => 'decimal:8',
        'prix_vente' => 'decimal:8',
        'paye_par_caisse' => 'boolean',
    ];

    public function approvisionnement()
    {
        return $this->belongsTo(approvisionnements::class, 'id_approvisionnement');
    }

    public function produit()
    {
        return $this->belongsTo(produits::class, 'id_produit');
    }

    public function devise()
    {
        return $this->belongsTo(devise::class, 'id_devise');
    }

    public function lots()
    {
        return $this->hasMany(lots::class, 'id_ligne_approvisionnement');
    }
}
