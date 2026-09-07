<?php

namespace App\Http\Controllers;

use App\Models\clients;
use App\Models\ventes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientController extends ApiCrudController
{
    protected string $modelClass = clients::class;
    protected array $searchable = ['nom', 'post_nom', 'prenom', 'contact', 'ville'];

    protected function indexQuery(Request $request): Builder
    {
        return clients::withCount('ventes');
    }

    protected function storeRules(): array
    {
        return [
            'nom'      => 'required|string|max:90',
            'post_nom' => 'required|string|max:90',
            'prenom'   => 'required|string|max:90',
            'adresse'  => 'required|string|max:63',
            'ville'    => 'required|string|max:50',
            'pays'     => 'required|string|max:50',
            'contact'  => 'required|string|max:50',
            'iduser'   => 'nullable|integer|exists:users,id',
        ];
    }

    protected function updateRules(\Illuminate\Database\Eloquent\Model $model): array
    {
        return [
            'nom'      => 'sometimes|string|max:90',
            'post_nom' => 'sometimes|string|max:90',
            'prenom'   => 'sometimes|string|max:90',
            'adresse'  => 'sometimes|string|max:63',
            'ville'    => 'sometimes|string|max:50',
            'pays'     => 'sometimes|string|max:50',
            'contact'  => 'sometimes|string|max:50',
            'iduser'   => 'nullable|integer|exists:users,id',
        ];
    }

    public function debts(int $id): JsonResponse
    {
        $client = clients::findOrFail($id);

        $debts = ventes::query()
            ->with(['deviseVente', 'vendeur'])
            ->where('id_client', $client->id)
            ->where('reste_a_payer', '>', 0)
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'client' => $client,
                'ventes' => $debts,
                'total_dette' => $debts->sum(fn (ventes $vente) => (float) $vente->reste_a_payer),
                'nombre_dettes' => $debts->count(),
            ],
        ]);
    }
}