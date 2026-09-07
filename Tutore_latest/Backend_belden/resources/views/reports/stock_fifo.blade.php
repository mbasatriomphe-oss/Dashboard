@extends('reports.layout')

@section('content')
    @php
        $totalEntree = array_sum(array_column($rows->toArray(), 'valeur_entree'));
        $totalSortie = array_sum(array_column($rows->toArray(), 'valeur_sortie'));
        $totalStock = array_sum(array_column($rows->toArray(), 'valeur_stock'));
        $qtyStock = array_sum(array_column($rows->toArray(), 'quantite_stock'));
    @endphp

    <div class="report-title"><h1>Fiche de Stock FIFO</h1></div>
    <div class="report-summary">
        <div class="summary-item"><strong>Lots</strong><div class="muted">{{ count($rows) }}</div></div>
        <div class="summary-item"><strong>Quantité en stock</strong><div class="muted">{{ number_format($qtyStock,0) }}</div></div>
        <div class="summary-item"><strong>Valeur stock</strong><div class="muted">{{ number_format($totalStock,2) }}</div></div>
        @if(!empty($currencyLabel))
            <div class="summary-item"><strong>Devise</strong><div class="muted">{{ $currencyLabel }}</div></div>
        @endif
    </div>
    @if(!empty($hasMissingRate))
        <div class="report-warning">Attention : certains lots n’ont pas de taux de conversion actif pour la devise cible. Les montants restants sont affichés dans leur devise source.</div>
    @endif

    @php
        $queryString = request()->getQueryString();
        $pdfUrl = url('/rapports/stock-fifo/pdf') . ($queryString ? "?{$queryString}" : '');
    @endphp

    <table>
        <thead>
            <tr>
                <th colspan="5" class="group-header">ENTRÉES</th>
                <th colspan="4" class="group-header">SORTIES</th>
                <th colspan="4" class="group-header">STOCKS</th>
            </tr>
            <tr>
                <th>Date</th>
                <th>Libellé</th>
                <th class="numeric">Qtés</th>
                <th class="numeric">CU</th>
                <th class="numeric">CT</th>
                <th>Date</th>
                <th class="numeric">Qtés</th>
                <th class="numeric">CU</th>
                <th class="numeric">CT</th>
                <th>Date</th>
                <th class="numeric">Qtés</th>
                <th class="numeric">CU</th>
                <th class="numeric">CT</th>
            </tr>
        </thead>
        <tbody>
            @foreach($rows as $row)
                <tr>
                    <td>{{ $row['date_reception'] }}</td>
                    <td>Entrée lot {{ $row['numero_lot'] }}</td>
                    <td class="numeric">{{ number_format($row['quantite_entree'] ?? 0,0) }}</td>
                    <td class="numeric">{{ number_format($row['prix_unitaire'] ?? 0,2) }}</td>
                    <td class="numeric">{{ number_format($row['valeur_entree'] ?? 0,2) }}</td>
                    <td>—</td>
                    <td class="numeric">—</td>
                    <td class="numeric">—</td>
                    <td class="numeric">—</td>
                    <td>{{ $row['date_reception'] }}</td>
                    <td class="numeric">{{ number_format($row['quantite_entree'] ?? 0,0) }}</td>
                    <td class="numeric">{{ number_format($row['prix_unitaire'] ?? 0,2) }}</td>
                    <td class="numeric">{{ number_format($row['valeur_entree'] ?? 0,2) }}</td>
                </tr>
                @if(!empty($row['quantite_sortie']))
                    <tr>
                        <td>{{ $row['dernier_sortie_date'] ?? '—' }}</td>
                        <td>Sortie lot {{ $row['numero_lot'] }}</td>
                        <td class="numeric">—</td>
                        <td class="numeric">—</td>
                        <td class="numeric">—</td>
                        <td>{{ $row['dernier_sortie_date'] ?? '—' }}</td>
                        <td class="numeric">{{ number_format($row['quantite_sortie'] ?? 0,0) }}</td>
                        <td class="numeric">{{ number_format($row['prix_unitaire'] ?? 0,2) }}</td>
                        <td class="numeric">{{ number_format($row['valeur_sortie'] ?? 0,2) }}</td>
                        <td>{{ $row['dernier_sortie_date'] ?? '—' }}</td>
                        <td class="numeric">{{ number_format($row['quantite_stock'] ?? 0,0) }}</td>
                        <td class="numeric">{{ number_format($row['prix_unitaire'] ?? 0,2) }}</td>
                        <td class="numeric">{{ number_format($row['valeur_stock'] ?? 0,2) }}</td>
                    </tr>
                @endif
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <th colspan="2">TOTAL</th>
                <th class="numeric">{{ number_format(array_sum(array_column($rows->toArray(), 'quantite_entree')),0) }}</th>
                <th></th>
                <th class="numeric">{{ number_format($totalEntree,2) }}</th>
                <th></th>
                <th class="numeric">{{ number_format(array_sum(array_column($rows->toArray(), 'quantite_sortie')),0) }}</th>
                <th class="numeric">{{ number_format($totalSortie,2) }}</th>
                <th></th>
                <th class="numeric">{{ number_format($qtyStock,0) }}</th>
                <th class="numeric">{{ number_format($totalStock / max($qtyStock, 1),2) }}</th>
                <th class="numeric">{{ number_format($totalStock,2) }}</th>
            </tr>
        </tfoot>
    </table>

    <div class="report-actions" style="margin-top: 1.5rem; text-align: right;">
        <a href="/api/rapports/stock-fifo/pdf?{{ request()->getQueryString() }}" target="_blank" rel="noreferrer" class="button button-primary">
            Exporter la fiche FIFO en PDF
        </a>
    </div>
@endsection
