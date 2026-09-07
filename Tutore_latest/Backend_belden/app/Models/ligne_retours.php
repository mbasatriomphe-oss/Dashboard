<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ligne_retours extends Model
{
    use HasFactory;

    protected $table = 'ligne_retours';

    protected $fillable = [
        'id_retour',
        'id_produit',
        'id_variante_produit',
        'id_ligne_vente',
        'id_lot',
        'quantite_retournee',
        'prix_vente_original',
        'prix_remboursement',
        'montant_penalite',
        'prix_unitaire_lot',
        'raison_difference',
        'justification_difference',
        'etat_produit',
        'reintegre_stock',
        'id_devise',
    ];

    protected $casts = [
        'prix_vente_original' => 'decimal:8',
        'prix_remboursement' => 'decimal:8',
        'montant_penalite' => 'decimal:8',
        'prix_unitaire_lot' => 'decimal:8',
        'reintegre_stock' => 'boolean',
    ];

    public function retour()
    {
        return $this->belongsTo(retours::class, 'id_retour');
    }

    public function produit()
    {
        return $this->belongsTo(produits::class, 'id_produit');
    }

    public function ligneVente()
    {
        return $this->belongsTo(ligne_ventes::class, 'id_ligne_vente');
    }

    public function lot()
    {
        return $this->belongsTo(lots::class, 'id_lot');
    }

    public function devise()
    {
        return $this->belongsTo(devise::class, 'id_devise');
    }

    public function mouvementsStock()
    {
        return $this->hasMany(mouvements_stock_fifos::class, 'id_ligne_retour');
    }
}
