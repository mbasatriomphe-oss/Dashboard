<?php

namespace App\Http\Controllers;

use App\Models\ligne_ventes;

class LigneVenteController extends ApiCrudController
{
    protected string $modelClass = ligne_ventes::class;

    protected function storeRules(): array
    {
        return [
            'id_vente' => 'required|integer|exists:ventes,id',
            'id_produit' => 'required|integer|exists:produits,id',
            'id_variante_produit' => 'nullable|integer|exists:variantes_produits,id',
            'quantite' => 'required|integer|min:1',
            'prix_vente' => 'required|numeric|min:0',
            'id_devise' => 'required|integer|exists:devises,id',
        ];
    }

    protected function updateRules(\Illuminate\Database\Eloquent\Model $model): array
    {
        return [
            'id_vente' => 'sometimes|integer|exists:ventes,id',
            'id_produit' => 'sometimes|integer|exists:produits,id',
            'id_variante_produit' => 'nullable|integer|exists:variantes_produits,id',
            'quantite' => 'sometimes|integer|min:1',
            'prix_vente' => 'sometimes|numeric|min:0',
            'id_devise' => 'sometimes|integer|exists:devises,id',
        ];
    }
}