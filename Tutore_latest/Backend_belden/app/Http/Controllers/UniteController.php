<?php

namespace App\Http\Controllers;

use App\Models\unites;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UniteController extends ApiCrudController
{
    protected string $modelClass = unites::class;

    protected string $defaultSort = 'nom';

    protected string $defaultSortDirection = 'asc';

    protected function storeRules(): array
    {
        return [
            'nom' => 'required|string|max:100|unique:unites,nom',
            'symbole' => 'required|string|max:10|unique:unites,symbole',
        ];
    }

    protected function updateRules(Model $model): array
    {
        return [
            'nom' => [
                'sometimes',
                'string',
                'max:100',
                Rule::unique('unites', 'nom')->ignore($model->getKey()),
            ],
            'symbole' => [
                'sometimes',
                'string',
                'max:10',
                Rule::unique('unites', 'symbole')->ignore($model->getKey()),
            ],
        ];
    }

    public function all(Request $request): JsonResponse
    {
        return parent::all($request);
    }
}