<?php

namespace App\Http\Controllers;

use App\Models\produits;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProduitController extends ApiCrudController
{
    protected string $modelClass = produits::class;
    protected array $searchable = ['code', 'nom', 'description'];

    protected function indexQuery(Request $request): Builder
    {
        $query = produits::with(['unite', 'categorie', 'variantes']);

        if ($request->filled('categorie_id')) {
            $query->where('categorie_id', $request->integer('categorie_id'));
        }

        if ($request->filled('unite_id')) {
            $query->where('unite_id', $request->integer('unite_id'));
        }

        return $query;
    }

    public function show(int $id): JsonResponse
    {
        $model = produits::with(['unite', 'categorie', 'variantes', 'valeursDynamiques'])->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $model,
        ]);
    }

    protected function storeRules(): array
    {
        return [
            'code' => 'sometimes|string|max:50|unique:produits,code',
            'nom' => 'required|string|max:100',
            'description' => 'nullable|string',
            'photo' => 'nullable|string|max:255',
            'photo_file' => 'nullable|file|image|max:4096',
            'unite_id' => 'required|integer|exists:unites,id',
            'categorie_id' => 'required|integer|exists:categories,id',
        ];
    }

    protected function updateRules(Model $model): array
    {
        return [
            'code' => ['sometimes', 'string', 'max:50', Rule::unique('produits', 'code')->ignore($model->getKey())],
            'nom' => 'sometimes|string|max:100',
            'description' => 'nullable|string',
            'photo' => 'nullable|string|max:255',
            'photo_file' => 'nullable|file|image|max:4096',
            'unite_id' => 'sometimes|integer|exists:unites,id',
            'categorie_id' => 'sometimes|integer|exists:categories,id',
        ];
    }

    protected function prepareStoreData(array $validated, Request $request): array
    {
        $validated['photo'] = $this->storePhoto($request, $validated['photo'] ?? null);

        if (empty($validated['code'])) {
            $validated['code'] = $this->generateUniqueCode('produits', 'code', 'PRO');
        }

        unset($validated['photo_file']);

        return $validated;
    }

    protected function prepareUpdateData(array $validated, Model $model, Request $request): array
    {
        $validated['photo'] = $this->storePhoto($request, $validated['photo'] ?? $model->getAttribute('photo'));
        unset($validated['photo_file']);

        return $validated;
    }

    private function storePhoto(Request $request, ?string $currentValue): ?string
    {
        $photoFile = $request->file('photo_file');

        if ($photoFile instanceof UploadedFile) {
            return $photoFile->store('produits', 'public');
        }

        return $currentValue !== null ? trim($currentValue) : null;
    }
}