@extends('reports.layout')

@section('content')
    @php
        $count = $ventes->count();
        $keys = $count ? array_keys((array) $ventes->first()) : [];
        $amountField = null;
        foreach (['montant_total','total','prix_total','amount','montant'] as $k) {
            if (in_array($k, $keys)) { $amountField = $k; break; }
        }
        $totalAmount = $amountField ? $ventes->sum($amountField) : null;
    @endphp

    <div class="report-title"><h1>Rapport - Ventes</h1></div>

    <div class="report-summary">
        <div class="summary-item"><strong>Ventes</strong><div class="muted">{{ $count }}</div></div>
        @if($totalAmount !== null)
            <div class="summary-item"><strong>Total</strong><div class="muted">{{ number_format($totalAmount, 2) }}</div></div>
        @endif
    </div>

    <table>
        <thead>
        @if(count($ventes) > 0)
            @php $first = (array) $ventes->first(); @endphp
            <tr>
                @foreach(array_keys($first) as $col)
                    @php $isNumeric = preg_match('/(montant|prix|total|amount|quantite|qty|price|cost)/i', $col) ? 'numeric' : '' ; @endphp
                    <th class="{{ $isNumeric }}">{{ ucfirst(str_replace('_', ' ', $col)) }}</th>
                @endforeach
            </tr>
        @else
            <tr><th>Aucune donnée</th></tr>
        @endif
        </thead>
        <tbody>
        @foreach($ventes as $v)
            @php $row = (array) $v; @endphp
            <tr>
                @foreach($row as $k => $cell)
                    @php $isNumeric = preg_match('/(montant|prix|total|amount|quantite|qty|price|cost)/i', $k);
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
