<?php

namespace App\Http\Controllers;

use App\Models\devise;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\Rule;

class DeviseController extends ApiCrudController
{
    protected string $modelClass = devise::class;

    protected function storeRules(): array
    {
        return [
            'code' => 'required|string|max:4|unique:devises,code',
            'nom' => 'required|string|max:50',
            'symbole' => 'required|string|max:10',
        ];
    }

    protected function updateRules(Model $model): array
    {
        return [
            'code' => ['sometimes', 'string', 'max:4', Rule::unique('devises', 'code')->ignore($model->getKey())],
            'nom' => 'sometimes|string|max:50',
            'symbole' => 'sometimes|string|max:10',
        ];
    }
}