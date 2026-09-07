<?php

namespace App\Http\Controllers;

use App\Models\transactions_caisses;

class TransactionCaisseController extends ApiCrudController
{
    protected string $modelClass = transactions_caisses::class;

    protected function storeRules(): array
    {
        return [
            'id_caisse' => 'required|integer|exists:caisses,id',
            'type' => 'required|in:entree,sortie',
            'montant' => 'required|numeric|min:0',
            'reference_type' => 'required|string|max:255',
            'reference_id' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'solde_avant' => 'required|numeric',
            'solde_apres' => 'required|numeric',
            'created_by' => 'nullable|integer|exists:users,id',
        ];
    }

    protected function updateRules(\Illuminate\Database\Eloquent\Model $model): array
    {
        return [
            'id_caisse' => 'sometimes|integer|exists:caisses,id',
            'type' => 'sometimes|in:entree,sortie',
            'montant' => 'sometimes|numeric|min:0',
            'reference_type' => 'sometimes|string|max:255',
            'reference_id' => 'sometimes|integer|min:1',
            'description' => 'nullable|string',
            'solde_avant' => 'sometimes|numeric',
            'solde_apres' => 'sometimes|numeric',
            'created_by' => 'nullable|integer|exists:users,id',
        ];
    }
}
