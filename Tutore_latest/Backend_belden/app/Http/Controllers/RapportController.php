<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Taux;

class RapportController extends Controller
{
    public function recapJournalier(): JsonResponse
    {
        $recap = DB::table('v_recap_journalier')->first();

        return response()->json([
            'status' => 'success',
            'data' => $recap,
        ]);
    }

    public function etatCaisses(): JsonResponse
    {
        $caisses = DB::table('v_etat_caisses')->orderBy('devise_code')->get();

        return response()->json([
            'status' => 'success',
            'data' => $caisses,
        ]);
    }

    public function chiffreAffaires(Request $request): JsonResponse
    {
        $query = DB::table('v_chiffre_affaires');

        // Accept both French param names (date_debut/date_fin) and generic start/end
        $start = $request->query('date_debut') ?? $request->query('start');
        $end = $request->query('date_fin') ?? $request->query('end');

        if ($start) {
            $query->whereDate('date_vente', '>=', $start);
        }

        if ($end) {
            $query->whereDate('date_vente', '<=', $end);
        }

        if ($request->filled('devise_code')) {
            $query->where('devise_code', $request->string('devise_code'));
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->orderByDesc('date_vente')->get(),
        ]);
    }

    /**
     * Retourne le bénéfice total par jour sur une période donnée.
     * Accepte les paramètres `date_debut`/`start` et `date_fin`/`end`.
     */
    public function beneficePeriod(Request $request): JsonResponse
    {
        $start = $request->query('date_debut') ?? $request->query('start');
        $end = $request->query('date_fin') ?? $request->query('end');

        // Optional target currency: accept devise_id or devise_code
        $targetDeviseId = null;
        if ($request->filled('devise_id')) {
            $targetDeviseId = (int) $request->query('devise_id');
        } elseif ($request->filled('devise_code')) {
            $targetDeviseId = DB::table('devises')->where('code', $request->string('devise_code'))->value('id');
        }

        // Precompute average purchase price per product
        $avgPurchaseRows = DB::table('ligne_approvisionnements as la')
            ->join('lots as l', 'l.id_ligne_approvisionnement', '=', 'la.id')
            ->select('l.id_produit', DB::raw('AVG(la.prix_unitaire) as avg_purchase'))
            ->groupBy('l.id_produit')
            ->get()
            ->keyBy('id_produit')
            ->map(function ($r) { return (float) $r->avg_purchase; })
            ->toArray();

        $linesQ = DB::table('ligne_ventes as lv')
            ->join('ventes as v', 'v.id', '=', 'lv.id_vente')
            ->leftJoin('devises as d', 'd.id', '=', 'lv.id_devise')
            ->select('lv.id_produit', 'lv.quantite', 'lv.prix_vente', 'lv.id_devise', 'v.date as vente_date', 'd.code as devise_code', DB::raw('v.id as vente_id'), DB::raw('DATE(v.date) as date_vente'));

        if ($start) $linesQ->whereDate('v.date', '>=', $start);
        if ($end) $linesQ->whereDate('v.date', '<=', $end);

        $lines = $linesQ->get();

        $result = [];

        foreach ($lines as $line) {
            $prodId = $line->id_produit;
            $qty = (float) $line->quantite;
            $salePrice = (float) $line->prix_vente;
            $avgPurchase = isset($avgPurchaseRows[$prodId]) ? (float) $avgPurchaseRows[$prodId] : 0.0;
            $profit = ($salePrice - $avgPurchase) * $qty;

            // handle conversion to target currency if requested
            if ($targetDeviseId) {
                $srcDevId = (int) $line->id_devise;
                $date = (string) $line->vente_date;
                $rate = $this->resolveRate($srcDevId, $targetDeviseId, $date);
                if ($rate === null) {
                    // skip or treat as zero
                    $convertedProfit = 0.0;
                } else {
                    $convertedProfit = $profit * $rate;
                }
                $devCode = DB::table('devises')->where('id', $targetDeviseId)->value('code');
            } else {
                $convertedProfit = $profit;
                $devCode = $line->devise_code;
            }

            $dateKey = $line->date_vente;
            if (! isset($result[$dateKey])) $result[$dateKey] = ['date_vente' => $dateKey, 'devise_code' => $devCode, 'benefice_total' => 0.0];
            $result[$dateKey]['benefice_total'] += $convertedProfit;
        }

        // return sorted by date desc
        $rows = array_values($result);
        usort($rows, fn($a, $b) => strcmp($b['date_vente'], $a['date_vente']));

        return response()->json(['status' => 'success', 'data' => $rows]);
    }

    /**
     * Retourne le bénéfice par produit sur une période donnée.
     * Paramètres: `date_debut`/`start`, `date_fin`/`end`, `limit`.
     */
    public function beneficeProduit(Request $request): JsonResponse
    {
        $start = $request->query('date_debut') ?? $request->query('start');
        $end = $request->query('date_fin') ?? $request->query('end');
        $limit = max(1, min((int) $request->query('limit', 50), 500));

        $targetDeviseId = null;
        if ($request->filled('devise_id')) {
            $targetDeviseId = (int) $request->query('devise_id');
        } elseif ($request->filled('devise_code')) {
            $targetDeviseId = DB::table('devises')->where('code', $request->string('devise_code'))->value('id');
        }

        // Precompute average purchase price per product
        $avgPurchaseRows = DB::table('ligne_approvisionnements as la')
            ->join('lots as l', 'l.id_ligne_approvisionnement', '=', 'la.id')
            ->select('l.id_produit', DB::raw('AVG(la.prix_unitaire) as avg_purchase'))
            ->groupBy('l.id_produit')
            ->get()
            ->keyBy('id_produit')
            ->map(function ($r) { return (float) $r->avg_purchase; })
            ->toArray();

        $linesQ = DB::table('ligne_ventes as lv')
            ->join('ventes as v', 'v.id', '=', 'lv.id_vente')
            ->join('produits as p', 'p.id', '=', 'lv.id_produit')
            ->leftJoin('devises as d', 'd.id', '=', 'lv.id_devise')
            ->select('lv.id_produit', 'p.code as produit_code', 'p.nom as produit_nom', 'lv.quantite', 'lv.prix_vente', 'lv.id_devise', 'v.date as vente_date', 'd.code as devise_code');

        if ($start) $linesQ->whereDate('v.date', '>=', $start);
        if ($end) $linesQ->whereDate('v.date', '<=', $end);

        $lines = $linesQ->get();

        $byProduct = [];

        foreach ($lines as $line) {
            $prodId = $line->id_produit;
            $qty = (float) $line->quantite;
            $salePrice = (float) $line->prix_vente;
            $avgPurchase = isset($avgPurchaseRows[$prodId]) ? (float) $avgPurchaseRows[$prodId] : 0.0;
            $profit = ($salePrice - $avgPurchase) * $qty;

            if ($targetDeviseId) {
                $srcDevId = (int) $line->id_devise;
                $date = (string) $line->vente_date;
                $rate = $this->resolveRate($srcDevId, $targetDeviseId, $date);
                $convertedProfit = $rate === null ? 0.0 : $profit * $rate;
                $devCode = DB::table('devises')->where('id', $targetDeviseId)->value('code');
            } else {
                $convertedProfit = $profit;
                $devCode = $line->devise_code;
            }

            if (! isset($byProduct[$prodId])) {
                $byProduct[$prodId] = [
                    'id_produit' => $prodId,
                    'produit_code' => $line->produit_code,
                    'produit_nom' => $line->produit_nom,
                    'devise_code' => $devCode,
                    'quantite_vendue' => 0,
                    'chiffre_affaires' => 0.0,
                    'benefice_total' => 0.0,
                ];
            }

            $byProduct[$prodId]['quantite_vendue'] += $qty;
            $byProduct[$prodId]['chiffre_affaires'] += $qty * $salePrice;
            $byProduct[$prodId]['benefice_total'] += $convertedProfit;
        }

        $rows = array_values($byProduct);
        usort($rows, fn($a, $b) => $b['benefice_total'] <=> $a['benefice_total']);
        $rows = array_slice($rows, 0, $limit);

        return response()->json(['status' => 'success', 'data' => $rows]);
    }

    /**
     * Resolve conversion rate from source currency id to target currency id on a given date.
     * Returns float rate (multiply source amount by this to get target amount) or null if unavailable.
     */
    private function resolveRate(?int $sourceDeviseId, ?int $targetDeviseId, string $date): ?float
    {
        if (! $sourceDeviseId || ! $targetDeviseId) return null;
        if ($sourceDeviseId === $targetDeviseId) return 1.0;

        $direct = Taux::query()
            ->where('statut', 'actif')
            ->where('devise_source', $sourceDeviseId)
            ->where('devise_but', $targetDeviseId)
            ->whereDate('date_effet', '<=', $date)
            ->orderByDesc('date_effet')
            ->orderByDesc('id')
            ->value('valeur');

        if ($direct !== null && (float) $direct > 0) {
            return (float) $direct;
        }

        $reverse = Taux::query()
            ->where('statut', 'actif')
            ->where('devise_source', $targetDeviseId)
            ->where('devise_but', $sourceDeviseId)
            ->whereDate('date_effet', '<=', $date)
            ->orderByDesc('date_effet')
            ->orderByDesc('id')
            ->value('valeur');

        if ($reverse === null || (float) $reverse <= 0) {
            return null;
        }

        return 1.0 / (float) $reverse;
    }

    public function topProduits(Request $request): JsonResponse
    {
        $limit = max(1, min((int) $request->query('limit', 10), 100));

        $produits = DB::table('v_top_produits')
            ->orderByDesc('chiffre_affaires')
            ->limit($limit)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $produits,
        ]);
    }

    public function lotsExpiration(Request $request): JsonResponse
    {
        $query = DB::table('v_lots_expiration');

        if ($request->filled('statut_expiration')) {
            $query->where('statut_expiration', $request->string('statut_expiration'));
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->orderBy('date_expiration')->get(),
        ]);
    }

    public function margeProduit(Request $request): JsonResponse
    {
        $limit = max(1, min((int) $request->query('limit', 50), 100));

        return response()->json([
            'status' => 'success',
            'data' => DB::table('v_marge_produit')
                ->orderByDesc('marge_pourcentage')
                ->limit($limit)
                ->get(),
        ]);
    }

    public function mouvementsCaisse(Request $request): JsonResponse
    {
        $query = DB::table('v_mouvements_caisse');

        if ($request->filled('devise_code')) {
            $query->where('devise_code', $request->string('devise_code'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->orderByDesc('date_mouvement')->get(),
        ]);
    }
}
