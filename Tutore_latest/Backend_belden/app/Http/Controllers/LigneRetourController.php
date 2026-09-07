<?php

namespace App\Http\Controllers;

use App\Models\ligne_retours;

class LigneRetourController extends ApiCrudController
{
    protected string $modelClass = ligne_retours::class;

    protected function storeRules(): array
    {
        return [
            'id_retour' => 'required|integer|exists:retours,id',
            'id_produit' => 'required|integer|exists:produits,id',
            'id_variante_produit' => 'nullable|integer|exists:variantes_produits,id',
            'id_ligne_vente' => 'required|integer|exists:ligne_ventes,id',
            'id_lot' => 'required|integer|exists:lots,id',
            'quantite_retournee' => 'required|integer|min:1',
            'prix_vente_original' => 'required|numeric|min:0',
            'prix_remboursement' => 'required|numeric|min:0',
            'montant_penalite' => 'nullable|numeric|min:0',
            'prix_unitaire_lot' => 'required|numeric|min:0',
            'raison_difference' => 'nullable|string|max:50',
            'justification_difference' => 'nullable|string',
            'etat_produit' => 'nullable|string|max:50',
            'reintegre_stock' => 'nullable|boolean',
            'id_devise' => 'required|integer|exists:devises,id',
        ];
    }

    protected function updateRules(\Illuminate\Database\Eloquent\Model $model): array
    {
        return [
            'id_retour' => 'sometimes|integer|exists:retours,id',
            'id_produit' => 'sometimes|integer|exists:produits,id',
            'id_variante_produit' => 'nullable|integer|exists:variantes_produits,id',
            'id_ligne_vente' => 'sometimes|integer|exists:ligne_ventes,id',
            'id_lot' => 'sometimes|integer|exists:lots,id',
            'quantite_retournee' => 'sometimes|integer|min:1',
            'prix_vente_original' => 'sometimes|numeric|min:0',
            'prix_remboursement' => 'sometimes|numeric|min:0',
            'montant_penalite' => 'nullable|numeric|min:0',
            'prix_unitaire_lot' => 'sometimes|numeric|min:0',
            'raison_difference' => 'nullable|string|max:50',
            'justification_difference' => 'nullable|string',
            'etat_produit' => 'nullable|string|max:50',
            'reintegre_stock' => 'nullable|boolean',
            'id_devise' => 'sometimes|integer|exists:devises,id',
        ];
    }
}