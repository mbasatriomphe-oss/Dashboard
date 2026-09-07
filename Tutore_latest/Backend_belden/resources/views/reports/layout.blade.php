<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title ?? 'Rapport' }}</title>
    <style>
        @page { size: A4; margin: 15mm }
        html, body { height: 100% }
        body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 12px; -webkit-print-color-adjust: exact }
        header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px }
        header h2 { margin: 0; font-size: 18px }
        .meta { font-size: 12px; color: #333 }
        .report-summary { display:flex; gap:12px; margin-bottom: 12px }
        .summary-item { background:#f7f7f8; padding:8px 10px; border-radius:6px; min-width:120px }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; page-break-inside: auto }
        th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px }
        th { background: #f6f6f6; text-align: left }
        th.group-header { background: #e9eff9; text-align: center; font-weight: 700; font-size: 12px; border-bottom: none }
        th.numeric, td.numeric { text-align: right }
        thead { display: table-header-group }
        tfoot { display: table-footer-group }
        tr { page-break-inside: avoid; page-break-after: auto }
        footer { position: fixed; bottom: 0; left: 0; right: 0; height: 28px; font-size: 11px; text-align: center; color: #666 }
        .report-title { margin: 6px 0 10px 0 }
        .muted { color: #666; font-size: 12px }
        .page-number:after { content: counter(page) }
    </style>
    @stack('head')
</head>
<body>
    <header>
        <div>
            <h2>{{ config('app.name', 'Belden') }}</h2>
            <div class="meta">Généré le: {{ date('Y-m-d H:i') }}</div>
        </div>
        <div>
            <img src="{{ asset('logo.png') }}" alt="logo" style="height:50px;object-fit:contain" onerror="this.style.display='none'" />
        </div>
    </header>

    <main>
        @yield('content')
    </main>

    <footer>
        {{ $footer ?? config('app.name', 'Belden') }} - Page <span class="pageNumber"></span>
    </footer>

    <script>
        (function() {
            try {
                var i = 1;
                var foot = document.querySelector('footer');
                // simple page number placeholder for browsers that support CSS counters in PDF
                // Puppeteer/Chrome will handle page numbering in many cases
            } catch(e){}
        })();
    </script>
</body>
</html>
