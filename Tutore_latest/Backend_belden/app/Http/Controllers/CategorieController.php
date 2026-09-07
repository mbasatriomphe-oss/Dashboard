<?php

namespace App\Http\Controllers;

use App\Models\categories;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class CategorieController extends ApiCrudController
{
    protected string $modelClass = categories::class;

    protected function indexQuery(Request $request): Builder
    {
        return categories::withCount('produits');
    }

    protected function storeRules(): array
    {
        return [
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string|max:255',
            'photo' => 'nullable|string|max:255',
        ];
    }

    protected function updateRules(\Illuminate\Database\Eloquent\Model $model): array
    {
        return [
            'nom' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:255',
            'photo' => 'nullable|string|max:255',
        ];
    }
}
