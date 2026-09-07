<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class produits extends Model
{
    use HasFactory;

    protected $table = 'produits';

    protected $fillable = [
        'code',
        'nom',
        'description',
        'photo',
        'unite_id',
        'categorie_id',
    ];

    public function unite()
    {
        return $this->belongsTo(unites::class, 'unite_id');
    }

    public function categorie()
    {
        return $this->belongsTo(categories::class, 'categorie_id');
    }

    public function lignesApprovisionnement()
    {
        return $this->hasMany(ligne_approvisionnements::class, 'id_produit');
    }

    public function lignesVente()
    {
        return $this->hasMany(ligne_ventes::class, 'id_produit');
    }

    public function lots()
    {
        return $this->hasMany(lots::class, 'id_produit');
    }

    public function lignesRetour()
    {
        return $this->hasMany(ligne_retours::class, 'id_produit');
    }

    public function variantes()
    {
        return $this->hasMany(variantes_produits::class, 'produit_id');
    }

    public function valeursDynamiques()
    {
        return $this->hasMany(valeurs_produit_dynamiques::class, 'produit_id');
    }
}
