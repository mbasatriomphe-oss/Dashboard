<?php

namespace App\Http\Controllers;

use App\Models\fournisseurs;
use Illuminate\Database\Eloquent\Builder;

class FournisseurController extends ApiCrudController
{
    protected string $modelClass = fournisseurs::class;
    protected array $searchable = ['nom', 'adresse', 'ville', 'pays', 'contact'];

    protected function indexQuery(\Illuminate\Http\Request $request): Builder
    {
        return fournisseurs::query();
    }

    protected function storeRules(): array
    {
        return [
            'nom' => 'required|string|max:90',
            'adresse' => 'required|string|max:63',
            'ville' => 'required|string|max:50',
            'pays' => 'required|string|max:50',
            'contact' => 'required|string|max:50',
        ];
    }

    protected function updateRules(\Illuminate\Database\Eloquent\Model $model): array
    {
        return [
            'nom' => 'sometimes|string|max:90',
            'adresse' => 'sometimes|string|max:63',
            'ville' => 'sometimes|string|max:50',
            'pays' => 'sometimes|string|max:50',
            'contact' => 'sometimes|string|max:50',
        ];
    }
}