<?php

namespace App\Http\Controllers;

use App\Models\retours;
use App\Models\ligne_retours;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class RetourController extends ApiCrudController
{
    protected string $modelClass = retours::class;
    protected array $searchable = ['code'];

    protected function indexQuery(Request $request): Builder
    {
        $query = retours::with([
            'vente',
            'client',
            'vendeur',
            'lignes.produit',
            'lignes.devise',
        ]);

        if ($request->filled('id_vente')) {
            $query->where('id_vente', $request->integer('id_vente'));
        }

        if ($request->filled('id_client')) {
            $query->where('id_client', $request->integer('id_client'));
        }

        return $query;
    }

    protected function storeRules(): array
    {
        return [
            'code'                              => 'sometimes|string|max:50|unique:retours,code',
            'date_retour'                       => 'required|date',
            'id_vente'                          => 'required|integer|exists:ventes,id',
            'id_client'                         => 'required|integer|exists:clients,id',
            'id_vendeur'                        => 'required|integer|exists:vendeurs,id',
            'motif'                             => 'nullable|string',
            'commentaire'                       => 'nullable|string',
            'lignes'                            => 'required|array|min:1',
            'lignes.*.id_produit'               => 'required|integer|exists:produits,id',
            'lignes.*.id_ligne_vente'           => 'required|integer|exists:ligne_ventes,id',
            'lignes.*.id_lot'                   => 'required|integer|exists:lots,id',
            'lignes.*.quantite_retournee'       => 'required|integer|min:1',
            'lignes.*.prix_vente_original'      => 'required|numeric|min:0',
            'lignes.*.prix_remboursement'       => 'required|numeric|min:0',
            'lignes.*.montant_penalite'         => 'nullable|numeric|min:0',
            'lignes.*.prix_unitaire_lot'        => 'required|numeric|min:0',
            'lignes.*.raison_difference'        => 'nullable|in:aucune,usage_client,deballage,decote_naturelle,promotion_remplacement,penalite_contrat,autre',
            'lignes.*.justification_difference' => 'nullable|string',
            'lignes.*.etat_produit'             => 'nullable|in:bon,lege_usage,endommage,defectueux,usage,emballage_ouvert',
            'lignes.*.reintegre_stock'          => 'nullable|boolean',
            'lignes.*.id_devise'                => 'required|integer|exists:devises,id',
        ];
    }

    protected function updateRules(Model $model): array
    {
        return [
            'code'        => ['sometimes', 'string', 'max:50', Rule::unique('retours', 'code')->ignore($model->getKey())],
            'date_retour' => 'sometimes|date',
            'id_vente'    => 'sometimes|integer|exists:ventes,id',
            'id_client'   => 'sometimes|integer|exists:clients,id',
            'id_vendeur'  => 'sometimes|integer|exists:vendeurs,id',
            'motif'       => 'nullable|string',
            'commentaire' => 'nullable|string',
        ];
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->storeRules());
        $lineItems = $validated['lignes'];

        $created = DB::transaction(function () use ($validated, $lineItems) {
            $code = $validated['code'] ?? $this->generateUniqueCode('retours', 'code', 'RET');

            /** @var retours $retour */
            $retour = retours::create([
                'code'        => $code,
                'date_retour' => $validated['date_retour'],
                'id_vente'    => (int) $validated['id_vente'],
                'id_client'   => (int) $validated['id_client'],
                'id_vendeur'  => (int) $validated['id_vendeur'],
                'motif'       => $validated['motif'] ?? null,
                'commentaire' => $validated['commentaire'] ?? null,
            ]);

            foreach ($lineItems as $item) {
                ligne_retours::create([
                    'id_retour'               => $retour->id,
                    'id_produit'              => (int) $item['id_produit'],
                    'id_ligne_vente'          => (int) $item['id_ligne_vente'],
                    'id_lot'                  => (int) $item['id_lot'],
                    'quantite_retournee'      => (int) $item['quantite_retournee'],
                    'prix_vente_original'     => $item['prix_vente_original'],
                    'prix_remboursement'      => $item['prix_remboursement'],
                    'montant_penalite'        => $item['montant_penalite'] ?? 0,
                    'prix_unitaire_lot'       => $item['prix_unitaire_lot'],
                    'raison_difference'       => $item['raison_difference'] ?? 'aucune',
                    'justification_difference'=> $item['justification_difference'] ?? null,
                    'etat_produit'            => $item['etat_produit'] ?? 'bon',
                    'reintegre_stock'         => $item['reintegre_stock'] ?? false,
                    'id_devise'               => (int) $item['id_devise'],
                ]);
            }

            return $retour->fresh(['client', 'vendeur', 'vente', 'lignes.produit', 'lignes.devise']);
        });

        return response()->json([
            'status' => 'success',
            'data'   => $created,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $retour    = retours::findOrFail($id);
        $validated = $request->validate($this->updateRules($retour));
        $retour->update($validated);

        return response()->json([
            'status' => 'success',
            'data'   => $retour->fresh(['client', 'vendeur', 'vente', 'lignes.produit', 'lignes.devise']),
        ]);
    }
}