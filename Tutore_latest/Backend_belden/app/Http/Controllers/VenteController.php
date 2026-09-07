<?php

namespace App\Http\Controllers;

use App\Models\Taux;
use App\Models\ventes;
use App\Models\ligne_ventes;
use App\Models\caisse;
use App\Models\transactions_caisses;
use App\Models\User;
use App\Notifications\CrudActionNotification;
use App\Notifications\StockInsuffisantNotification;
use Brick\Math\BigDecimal;
use Brick\Math\RoundingMode;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\Rule;

class VenteController extends ApiCrudController
{
    protected string $modelClass = ventes::class;
    protected array $searchable = ['code'];

    protected function ensureVendorUser(): ?JsonResponse
    {
        $user = auth()->user();
        $role = $user->role ?? null;

        if ($role !== 'vendeur') {
            return response()->json([
                'status' => 'error',
                'message' => 'Seul un vendeur peut créer ou modifier une vente.',
            ], 403);
        }

        return null;
    }

    protected function canCancelSale(): bool
    {
        $role = auth()->user()?->role ?? null;

        return in_array($role, ['admin', 'vendeur'], true);
    }

    private function notifySaleAction(string $action, ventes $vente): void
    {
        $actor = auth()->user();
        $recipients = collect(User::query()->where('role', 'admin')->get());

        if ($actor && method_exists($actor, 'notify')) {
            $recipients->push($actor);
        }

        $recipients = $recipients->filter()->unique(function ($recipient): string {
            return get_class($recipient) . ':' . (string) $recipient->getKey();
        })->values();

        if ($recipients->isEmpty()) {
            return;
        }

        $titles = [
            'created' => 'Vente réussie',
            'updated' => 'Vente modifiée',
            'deleted' => 'Vente supprimée',
        ];

        $messages = [
            'created' => 'La vente a été enregistrée avec succès.',
            'updated' => 'La vente a été modifiée avec succès.',
            'deleted' => 'La vente a été supprimée avec succès.',
        ];

        Notification::send($recipients, new CrudActionNotification([
            'type' => 'vente_' . $action,
            'title' => $titles[$action] ?? 'Vente',
            'message' => $messages[$action] ?? 'Action réalisée sur une vente.',
            'action' => $action,
            'entity' => 'Vente',
            'entity_id' => $vente->getKey(),
            'entity_name' => $vente->code,
            'actor_id' => $actor?->getKey(),
            'actor_name' => $actor?->nom ?? $actor?->name ?? $actor?->email ?? 'Système',
        ]));
    }

    private function decimalValue(string|int|float $value): BigDecimal
    {
        return BigDecimal::of((string) $value);
    }

    private function formatDecimal(BigDecimal $value): string
    {
        return $value->toScale(8, RoundingMode::HALF_UP)->__toString();
    }

    protected function resolveTauxToCurrency(int $sourceCurrencyId, int $targetCurrencyId, string $date): ?BigDecimal
    {
        if ($sourceCurrencyId === $targetCurrencyId) {
            return BigDecimal::of('1');
        }

        $directRate = Taux::query()
            ->where('statut', 'actif')
            ->where('devise_source', $sourceCurrencyId)
            ->where('devise_but', $targetCurrencyId)
            ->whereDate('date_effet', '<=', $date)
            ->orderByDesc('date_effet')
            ->orderByDesc('id')
            ->value('valeur');

        if ($directRate !== null) {
            return BigDecimal::of((string) $directRate);
        }

        $reverseRate = Taux::query()
            ->where('statut', 'actif')
            ->where('devise_source', $targetCurrencyId)
            ->where('devise_but', $sourceCurrencyId)
            ->whereDate('date_effet', '<=', $date)
            ->orderByDesc('date_effet')
            ->orderByDesc('id')
            ->value('valeur');

        if ($reverseRate === null || (float) $reverseRate <= 0) {
            return null;
        }

        return BigDecimal::of('1')->dividedBy(BigDecimal::of((string) $reverseRate), 8, RoundingMode::HALF_UP);
    }

    protected function calculatePaymentSummary(array $validated, array $lineItems, array $payments): array
    {
        $saleCurrencyId = (int) ($validated['devise_vente_id'] ?? ($lineItems[0]['id_devise'] ?? 0));
        $saleDate = (string) $validated['date'];

        $total = BigDecimal::of('0');

        foreach ($lineItems as $item) {
            $lineCurrencyId = (int) ($item['id_devise'] ?? 0);
            $lineAmount = BigDecimal::of((string) $item['prix_vente'])->multipliedBy(BigDecimal::of((string) $item['quantite']));

            $rate = $this->resolveTauxToCurrency($lineCurrencyId, $saleCurrencyId, $saleDate);

            if (! $rate) {
                throw new \RuntimeException('Impossible de convertir une ligne de vente vers la devise de vente. Vérifie les taux actifs.');
            }

            $total = $total->plus($lineAmount->multipliedBy($rate));
        }

        $paymentFee = BigDecimal::of((string) ($validated['frais_transaction'] ?? '0'));
        $total = $total->plus($paymentFee);

        $paid = BigDecimal::of('0');

        foreach ($payments as $payment) {
            $paymentCurrencyId = (int) $payment['devise_id'];
            $paymentAmount = BigDecimal::of((string) $payment['montant']);
            $rate = $this->resolveTauxToCurrency($paymentCurrencyId, $saleCurrencyId, $saleDate);

            if (! $rate) {
                throw new \RuntimeException('Impossible de convertir un paiement vers la devise de vente. Vérifie les taux actifs.');
            }

            $paid = $paid->plus($paymentAmount->multipliedBy($rate));
        }

        $remaining = $total->minus($paid);

        if ($remaining->isLessThan(BigDecimal::of('0'))) {
            $remaining = BigDecimal::of('0');
        }

        return [
            'devise_vente_id' => $saleCurrencyId,
            'montant_total' => $this->formatDecimal($total),
            'montant_paye' => $this->formatDecimal($paid),
            'reste_a_payer' => $this->formatDecimal($remaining),
            'statut_paiement' => $remaining->isGreaterThan(BigDecimal::of('0')) ? 'partielle' : 'payee',
        ];
    }

    public function createSaleFromPayload(array $validated, array $lineItems, array $payments): ventes
    {
        return DB::transaction(function () use ($validated, $lineItems, $payments) {
            $paymentSummary = $this->calculatePaymentSummary($validated, $lineItems, $payments);
            $code = $validated['code'] ?? $this->generateUniqueCode('ventes', 'code', 'VEN');

            /** @var ventes $vente */
            $vente = ventes::create([
                'code'       => $code,
                'date'       => $validated['date'],
                'id_vendeur' => (int) $validated['id_vendeur'],
                'id_client'  => (int) $validated['id_client'],
                'devise_vente_id' => $paymentSummary['devise_vente_id'],
                'montant_total' => $paymentSummary['montant_total'],
                'montant_paye' => $paymentSummary['montant_paye'],
                'reste_a_payer' => $paymentSummary['reste_a_payer'],
                'statut_paiement' => $paymentSummary['statut_paiement'],
                'mode_paiement' => $validated['mode_paiement'] ?? 'cash',
                'paiement_en_ligne' => $validated['paiement_en_ligne'] ?? false,
                'frais_transaction' => $validated['frais_transaction'] ?? 0,
            ]);

            foreach ($lineItems as $item) {
                ligne_ventes::create([
                    'id_vente'             => $vente->id,
                    'id_produit'           => (int) $item['id_produit'],
                    'id_variante_produit'  => isset($item['id_variante_produit']) ? (int) $item['id_variante_produit'] : null,
                    'quantite'             => (int) $item['quantite'],
                    'prix_vente'           => $item['prix_vente'],
                    'id_devise'            => (int) $item['id_devise'],
                ]);
            }

            if (! ($validated['paiement_en_ligne'] ?? false)) {
                foreach ($payments as $payment) {
                    $this->recordCashMovement(
                        (int) $payment['devise_id'],
                        'entree',
                        (float) $payment['montant'],
                        'vente',
                        $vente->id,
                        'Paiement de la vente #' . $vente->code,
                    );
                }
            }

            return $vente->fresh(['client', 'vendeur', 'deviseVente', 'lignes.produit', 'lignes.devise', 'transactionsCaisses.caisse.devise']);
        });
    }

    protected function indexQuery(Request $request): Builder
    {
        $query = ventes::with(['vendeur', 'client', 'deviseVente', 'lignes.produit', 'lignes.devise', 'transactionsCaisses.caisse.devise']);
        $user = $request->user();

        if (($user?->role ?? null) === 'vendeur') {
            $query->where('id_vendeur', (int) $user->id);
        }

        if ($request->filled('id_vendeur')) {
            $query->where('id_vendeur', $request->integer('id_vendeur'));
        }

        if ($request->filled('id_client')) {
            $query->where('id_client', $request->integer('id_client'));
        }

        // Support both single date and date ranges (date / start & end)
        if ($request->filled('date')) {
            $query->whereDate('date', $request->date('date'));
        } else {
            $start = $request->query('date_debut') ?? $request->query('start');
            $end = $request->query('date_fin') ?? $request->query('end');

            if ($start) {
                $query->whereDate('date', '>=', $start);
            }

            if ($end) {
                $query->whereDate('date', '<=', $end);
            }
        }

        if ($request->filled('payment_status')) {
            $paymentStatus = $request->string('payment_status')->toString();

            if ($paymentStatus === 'due') {
                $query->where('reste_a_payer', '>', 0);
            } elseif ($paymentStatus === 'paid') {
                $query->where('reste_a_payer', '<=', 0);
            } elseif ($paymentStatus === 'partial') {
                $query->where('statut_paiement', 'partielle');
            }
        }
        $period = strtolower((string) $request->query('period', ''));

        if ($period === 'daily') {
            $query->whereDate('created_at', $request->filled('date') ? $request->date('date') : now()->toDateString());
        } elseif ($period === 'monthly') {
            $month = (string) $request->query('month', now()->format('Y-m'));

            if (preg_match('/^\d{4}-\d{2}$/', $month) === 1) {
                [$year, $monthNumber] = array_map('intval', explode('-', $month, 2));
                $query->whereYear('created_at', $year)->whereMonth('created_at', $monthNumber);
            }
        }

        // Optional payment currency filter: 'franc', 'dollar', 'both'
        $paymentFilter = strtolower((string) $request->query('payment_currency', ''));
        if ($paymentFilter !== '') {
            $francId = DB::table('devises')->where(function ($q) {
                $q->whereRaw("lower(code) = 'cdf' OR lower(code) = 'fc'")
                    ->orWhereRaw("lower(nom) LIKE '%franc%'")
                    ->orWhere('symbole', 'FC');
            })->value('id');

            $dollarId = DB::table('devises')->where(function ($q) {
                $q->whereRaw("lower(code) = 'usd'")
                    ->orWhereRaw("lower(nom) LIKE '%dollar%'")
                    ->orWhere('symbole', '$');
            })->value('id');

            if ($paymentFilter === 'franc' && $francId) {
                $query->paidInCurrency($francId);
            } elseif ($paymentFilter === 'dollar' && $dollarId) {
                $query->paidInCurrency($dollarId);
            } elseif ($paymentFilter === 'both' && $francId && $dollarId) {
                $query->paidInBothCurrencies($francId, $dollarId);
            }
        }

        return $query;
    }

    private function cancellationBlockedReason(ventes $vente): ?string
    {
        $user = auth()->user();
        $role = $user?->role ?? null;

        if ($role === 'admin') {
            return null;
        }

        if ($role !== 'vendeur') {
            return 'Vous n\'êtes pas autorisé à annuler cette vente.';
        }

        if ((int) ($vente->id_vendeur ?? 0) !== (int) ($user?->id ?? 0)) {
            return 'Vous ne pouvez annuler que vos propres ventes.';
        }

        if (! $vente->created_at || $vente->created_at->diffInMinutes(now()) > 60) {
            return 'Une vente ne peut être annulée que dans l\'heure qui suit sa création.';
        }

        return null;
    }

    protected function storeRules(): array
    {
        return [
            'code'                    => 'sometimes|string|max:50|unique:ventes,code',
            'date'                    => 'required|date',
            'id_vendeur'              => 'required|integer|exists:vendeurs,id',
            'id_client'               => 'required|integer|exists:clients,id',
            'devise_vente_id'         => 'nullable|integer|exists:devises,id',
            'mode_paiement'           => 'sometimes|string|in:cash,card',
            'paiement_en_ligne'       => 'sometimes|boolean',
            'frais_transaction'       => 'sometimes|numeric|min:0',
            'paiements'               => 'required|array|min:1',
            'paiements.*.devise_id'   => 'required|integer|exists:devises,id',
            'paiements.*.montant'     => 'required|numeric|min:0.01',
            'lignes'                  => 'required|array|min:1',
            'lignes.*.id_produit'           => 'required|integer|exists:produits,id',
            'lignes.*.id_variante_produit'  => 'nullable|integer|exists:variantes_produits,id',
            'lignes.*.quantite'             => 'required|integer|min:1',
            'lignes.*.prix_vente'           => 'required|numeric|min:0',
            'lignes.*.id_devise'            => 'required|integer|exists:devises,id',
        ];
    }

    protected function recordCashMovement(
        int $deviseId,
        string $type,
        float $montant,
        string $referenceType,
        int $referenceId,
        string $description,
        ?int $createdBy = null,
    ): void {
        $caisse = caisse::query()
            ->where('id_devise', $deviseId)
            ->lockForUpdate()
            ->first();

        if (! $caisse) {
            throw new \RuntimeException('Aucune caisse n\'est configurée pour cette devise.');
        }

        $montantDecimal = $this->decimalValue($montant);
        $soldeAvant = $this->decimalValue($caisse->solde);

        if ($type === 'sortie' && $soldeAvant->isLessThan($montantDecimal)) {
            throw new \RuntimeException('Solde insuffisant dans la caisse.');
        }

        $soldeApres = $type === 'entree'
            ? $soldeAvant->plus($montantDecimal)
            : $soldeAvant->minus($montantDecimal);

        $caisse->update(['solde' => $this->formatDecimal($soldeApres)]);

        transactions_caisses::create([
            'id_caisse' => $caisse->getKey(),
            'type' => $type,
            'montant' => $this->formatDecimal($montantDecimal),
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'description' => $description,
            'solde_avant' => $this->formatDecimal($soldeAvant),
            'solde_apres' => $this->formatDecimal($soldeApres),
            'created_by' => $createdBy ?? auth()->user()?->id,
        ]);
    }

    protected function updateRules(Model $model): array
    {
        return [
            'code'       => ['sometimes', 'string', 'max:50', Rule::unique('ventes', 'code')->ignore($model->getKey())],
            'date'       => 'sometimes|date',
            'id_vendeur' => 'sometimes|integer|exists:vendeurs,id',
            'id_client'  => 'sometimes|integer|exists:clients,id',
        ];
    }

    public function store(Request $request): JsonResponse
    {
        if ($response = $this->ensureVendorUser()) {
            return $response;
        }

        $validated = $request->validate($this->storeRules());

        $lineItems = $validated['lignes'];
        $payments = $validated['paiements'];
        $lineKeys = array_map(static fn (array $l) => sprintf('%d:%s', (int) $l['id_produit'], isset($l['id_variante_produit']) ? (string) $l['id_variante_produit'] : 'null'), $lineItems);

        if (count($lineKeys) !== count(array_unique($lineKeys))) {
            return response()->json([
                'status' => 'error',
                'message' => 'Un même produit avec la même variante ne peut apparaître qu\'une seule fois dans la même vente.',
            ], 422);
        }

        $stockRows = DB::table('v_stock_disponible')
            ->whereIn('id', $productIds)
            ->get()
            ->keyBy('id');

        $insufficientItems = [];
        foreach ($lineItems as $item) {
            $productId = (int) $item['id_produit'];
            $availableStock = (int) ($stockRows->get($productId)?->stock_actuel ?? 0);
            $requestedQuantity = (int) $item['quantite'];

            if ($availableStock < $requestedQuantity) {
                $product = DB::table('produits')->where('id', $productId)->first();
                $insufficientItems[] = [
                    'id_produit' => $productId,
                    'produit' => $product?->nom ?? $product?->code ?? "Produit #{$productId}",
                    'demande' => $requestedQuantity,
                    'disponible' => $availableStock,
                ];
            }
        }

        if ($insufficientItems !== []) {
            $admins = User::query()->where('role', 'admin')->get();

            if ($admins->isNotEmpty()) {
                Notification::send($admins, new StockInsuffisantNotification([
                    'message' => 'Une vente a été refusée car le stock était insuffisant.',
                    'vente_code' => $validated['code'] ?? null,
                    'items' => $insufficientItems,
                    'created_by' => (int) (auth()->user()?->id ?? 0),
                    'created_by_name' => auth()->user()?->nom ?? auth()->user()?->email ?? 'Système',
                ]));
            }

            return response()->json([
                'status' => 'error',
                'message' => 'Stock insuffisant pour cette vente',
                'details' => $insufficientItems,
            ], 422);
        }

        try {
            $created = $this->createSaleFromPayload($validated, $lineItems, $payments);

            $this->notifySaleAction('created', $created);
        } catch (QueryException|\RuntimeException $exception) {
            if (str_contains($exception->getMessage(), 'Stock insuffisant pour cette vente')) {
                $admins = User::query()->where('role', 'admin')->get();

                if ($admins->isNotEmpty()) {
                    Notification::send($admins, new StockInsuffisantNotification([
                        'message' => 'Le trigger de stock a refusé une vente.',
                        'vente_code' => $validated['code'] ?? null,
                        'items' => array_map(static fn (array $item) => [
                            'id_produit' => (int) $item['id_produit'],
                            'demande' => (int) $item['quantite'],
                        ], $lineItems),
                        'created_by' => (int) (auth()->user()?->id ?? 0),
                        'created_by_name' => auth()->user()?->nom ?? auth()->user()?->email ?? 'Système',
                    ]));
                }
            }

            return response()->json([
                'status' => 'error',
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $created,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if ($response = $this->ensureVendorUser()) {
            return $response;
        }

        $vente     = ventes::findOrFail($id);
        $validated = $request->validate($this->updateRules($vente));
        $vente->update($validated);

        $freshVente = $vente->fresh(['client', 'vendeur', 'deviseVente', 'lignes.produit', 'lignes.devise', 'transactionsCaisses.caisse.devise']);
        $this->notifySaleAction('updated', $freshVente);

        return response()->json([
            'status' => 'success',
            'data'   => $freshVente,
        ]);
    }

    public function addPayment(Request $request, int $id): JsonResponse
    {
        if ($response = $this->ensureVendorUser()) {
            return $response;
        }

        $rules = [
            'paiements' => 'required|array|min:1',
            'paiements.*.devise_id' => 'required|integer|exists:devises,id',
            'paiements.*.montant' => 'required|numeric|min:0.01',
        ];

        $validated = $request->validate($rules);

        $vente = ventes::with('lignes')->findOrFail($id);

        $lineItems = array_map(static function ($l) {
            return [
                'id_produit' => (int) $l['id_produit'],
                'quantite' => (int) $l['quantite'],
                'prix_vente' => $l['prix_vente'],
                'id_devise' => (int) $l['id_devise'],
            ];
        }, $vente->lignes->map(function ($l) {
            return ['id_produit' => $l->id_produit, 'quantite' => $l->quantite, 'prix_vente' => $l->prix_vente, 'id_devise' => $l->id_devise];
        })->all());

        $payments = $validated['paiements'];

        try {
            $updated = DB::transaction(function () use ($validated, $lineItems, $payments, $vente) {
                // Validate that a caisse exists for each payment devise before recording
                foreach ($payments as $payment) {
                    $deviseId = (int) $payment['devise_id'];
                    $caisseExists = caisse::query()->where('id_devise', $deviseId)->exists();
                    if (! $caisseExists) {
                        throw new \RuntimeException("Aucune caisse configurée pour la devise id={$deviseId}. Configure une caisse avant d'enregistrer ce paiement.");
                    }
                }

                // Record cash movements for each payment
                foreach ($payments as $payment) {
                    $this->recordCashMovement(
                        (int) $payment['devise_id'],
                        'entree',
                        (float) $payment['montant'],
                        'vente',
                        $vente->id,
                        'Paiement (complément) de la vente #' . $vente->code,
                    );
                }

                // Recalculate payment summary
                $validatedContext = ['devise_vente_id' => $vente->devise_vente_id, 'date' => $vente->date->toDateString()];
                $summary = $this->calculatePaymentSummary($validatedContext, $lineItems, array_merge($this->collectExistingPayments($vente->id), $payments));

                $vente->update([
                    'montant_total' => $summary['montant_total'],
                    'montant_paye' => $summary['montant_paye'],
                    'reste_a_payer' => $summary['reste_a_payer'],
                    'statut_paiement' => $summary['statut_paiement'],
                ]);

                return $vente->fresh(['client', 'vendeur', 'deviseVente', 'lignes.produit', 'lignes.devise', 'transactionsCaisses.caisse.devise']);
            });

            $this->notifySaleAction('updated', $updated);

            return response()->json(['status' => 'success', 'data' => $updated], 200);
        } catch (QueryException|\RuntimeException $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }

    private function collectExistingPayments(int $venteId): array
    {
        $rows = transactions_caisses::query()
            ->where('reference_type', 'vente')
            ->where('reference_id', $venteId)
            ->get()
            ->map(function ($t) {
                return ['devise_id' => $t->caisse?->id_devise ?? null, 'montant' => $t->montant];
            })
            ->filter(function ($p) { return !empty($p['devise_id']); })
            ->all();

        return $rows;
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $vente = ventes::with(['lignes', 'retours', 'vendeur'])->findOrFail($id);

            if ($reason = $this->cancellationBlockedReason($vente)) {
                return response()->json([
                    'status' => 'error',
                    'message' => $reason,
                ], 422);
            }

            $vente = DB::transaction(function () use ($vente) {
                /** @var ventes $vente */
                if ($vente->retours()->exists()) {
                    throw new \RuntimeException('Cette vente contient déjà un retour et ne peut pas être annulée.');
                }

                $lineIds = $vente->lignes->pluck('id')->all();
                $cashTransactions = transactions_caisses::query()
                    ->where('reference_type', 'vente')
                    ->where('reference_id', $vente->id)
                    ->orderByDesc('id')
                    ->lockForUpdate()
                    ->get();

                foreach ($cashTransactions as $transaction) {
                    $caisse = caisse::query()
                        ->where('id', $transaction->id_caisse)
                        ->lockForUpdate()
                        ->first();

                    if (! $caisse) {
                        throw new \RuntimeException('Caisse introuvable pour rétablir la vente.');
                    }

                    $montant = $this->decimalValue($transaction->montant);
                    $soldeActuel = $this->decimalValue($caisse->solde);
                    $soldeApresAnnulation = $transaction->type === 'entree'
                        ? $soldeActuel->minus($montant)
                        : $soldeActuel->plus($montant);

                    $caisse->update(['solde' => $this->formatDecimal($soldeApresAnnulation)]);
                    $transaction->delete();
                }

                if ($lineIds !== []) {
                    DB::table('mouvements_stock_fifos')
                        ->whereIn('id_ligne_vente', $lineIds)
                        ->delete();

                    ligne_ventes::query()
                        ->where('id_vente', $vente->id)
                        ->delete();
                }

                $vente->delete();

                return $vente;
            });

            $this->notifySaleAction('deleted', $vente);
        } catch (\RuntimeException $exception) {
            return response()->json([
                'status' => 'error',
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Suppression effectuee',
        ]);
    }

}