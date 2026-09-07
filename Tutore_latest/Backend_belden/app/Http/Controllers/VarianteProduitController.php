<?php

namespace App\Http\Controllers;

use App\Models\variantes_produits;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VarianteProduitController extends ApiCrudController
{
    protected string $modelClass = variantes_produits::class;
    protected array $searchable = ['code_sku'];

    protected function indexQuery(Request $request): Builder
    {
        $query = variantes_produits::with(['produit']);

        if ($request->filled('produit_id')) {
            $query->where('produit_id', $request->integer('produit_id'));
        }

        return $query;
    }

    protected function storeRules(): array
    {
        return [
            'produit_id' => 'required|integer|exists:produits,id',
            'code_sku' => 'required|string|max:255|unique:variantes_produits,code_sku',
            'combinaison' => 'nullable|array',
            'combinaison.*.key' => 'required_with:combinaison|string|max:100',
            'combinaison.*.value' => 'required_with:combinaison|string|max:255',
            'prix_ht' => 'nullable|numeric|min:0',
            'prix_ttc' => 'nullable|numeric|min:0',
            'quantite_stock' => 'nullable|integer|min:0',
            'quantite_reservee' => 'nullable|integer|min:0',
            'seuil_alerte' => 'nullable|integer|min:0',
            'code_barre' => 'nullable|string|max:100',
            'poids_kg' => 'nullable|numeric|min:0',
        ];
    }

    protected function updateRules(Model $model): array
    {
        return [
            'produit_id' => 'sometimes|integer|exists:produits,id',
            'code_sku' => ['required', 'string', 'max:255', Rule::unique('variantes_produits', 'code_sku')->ignore($model->getKey())],
            'combinaison' => 'nullable|array',
            'combinaison.*.key' => 'required_with:combinaison|string|max:100',
            'combinaison.*.value' => 'required_with:combinaison|string|max:255',
            'prix_ht' => 'nullable|numeric|min:0',
            'prix_ttc' => 'nullable|numeric|min:0',
            'quantite_stock' => 'nullable|integer|min:0',
            'quantite_reservee' => 'nullable|integer|min:0',
            'seuil_alerte' => 'nullable|integer|min:0',
            'code_barre' => 'nullable|string|max:100',
            'poids_kg' => 'nullable|numeric|min:0',
        ];
    }
}
