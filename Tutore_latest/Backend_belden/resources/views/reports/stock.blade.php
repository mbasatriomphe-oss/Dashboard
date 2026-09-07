@extends('reports.layout')

@section('content')
    @php
        $totalValue = 0;
        foreach($produits as $p) {
            $row = (array) $p;
            $qty = $row['stock_actuel'] ?? $row['quantite'] ?? $row['qte'] ?? 0;
            $price = $row['prix_unitaire'] ?? $row['prix'] ?? $row['cost'] ?? 0;
            $totalValue += (float)$qty * (float)$price;
        }
    @endphp

    <div class="report-title"><h1>Rapport - Stock</h1></div>
    <div class="report-summary">
        <div class="summary-item"><strong>Produits</strong><div class="muted">{{ count($produits) }}</div></div>
        <div class="summary-item"><strong>Valeur stock</strong><div class="muted">{{ number_format($totalValue, 2) }}</div></div>
    </div>

    <table>
        <thead>
        @if(count($produits) > 0)
            @php $first = (array) $produits->first(); @endphp
            <tr>
                @foreach(array_keys($first) as $col)
                    @php $isNumeric = preg_match('/(quantite|qte|stock|prix|valeur|cost|montant)/i', $col) ? 'numeric' : '' ; @endphp
                    <th class="{{ $isNumeric }}">{{ ucfirst(str_replace('_', ' ', $col)) }}</th>
                @endforeach
            </tr>
        @else
            <tr><th>Aucune donnée</th></tr>
        @endif
        </thead>
        <tbody>
        @foreach($produits as $p)
            @php $row = (array) $p; @endphp
            <tr>
                @foreach($row as $k => $cell)
                    @php $isNumeric = preg_match('/(quantite|qte|stock|prix|valeur|cost|montant)/i', $k);
                        $display = $cell;
                        if ($isNumeric && is_numeric($cell)) { $display = number_format($cell, 2); }
                    @endphp
                    <td class="{{ $isNumeric ? 'numeric' : '' }}">{{ $display }}</td>
                @endforeach
            </tr>
        @endforeach
        </tbody>
    </table>
@endsection
