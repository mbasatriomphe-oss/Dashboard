<?php

namespace App\Http\Controllers;

use App\Models\MaishaPaySession;
use App\Http\Controllers\VenteController;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Http;

class MaishaPayController extends Controller
{
    public function createSession(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0.01',
            'currency_code' => 'required|string|max:10',
            'receipt' => 'required|string|max:255',
            'devise_vente_id' => 'required|integer|exists:devises,id',
            'mode_paiement' => 'required|string|in:card,cash',
            'frais_transaction' => 'required|numeric|min:0',
            'payload' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Données de session invalides',
                'errors' => $validator->errors(),
            ], 422);
        }

        $session = MaishaPaySession::create([
            'reference' => $request->input('receipt'),
            'mode_paiement' => $request->input('mode_paiement'),
            'devise_vente_id' => $request->input('devise_vente_id'),
            'currency_code' => $request->input('currency_code'),
            'payment_amount' => $request->input('amount'),
            'frais_transaction' => $request->input('frais_transaction', 0),
            'payload' => $request->input('payload', []),
            'status' => 'pending',
            'created_by' => $request->user()?->id,
        ]);

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $session->id,
                'reference' => $session->reference,
                'redirect_url' => route('maishapay.redirect', ['session' => $session->id], true),
            ],
        ], 201);
    }

    public function redirectToMaishaPay(Request $request, MaishaPaySession $session): Response
    {
        if ($session->status !== 'pending') {
            return redirect($this->frontendFailureUrl($session));
        }

        $formAction = config('maishapay.form_action');
        $publicApiKey = config('maishapay.public_api_key');
        $secretApiKey = config('maishapay.secret_api_key');

        // Build fields using vendor parameter names. We'll POST server->MaishaPay to keep the secret key server-side.
        $fields = [
            'gatewayMode' => config('maishapay.gateway_mode'),
            'publicApiKey' => $publicApiKey,
            'secretApiKey' => $secretApiKey,

            'montant' => $session->payment_amount,
            'devise' => $session->currency_code,
            'reference' => $session->reference,

            'page_callback_succes' => $this->frontendSuccessUrl($session),
            'page_callback_faillure' => $this->frontendFailureUrl($session),
            'page_callback_cancel' => $this->frontendCancelUrl($session),
        ];

        // Build a client-side POST form to the MaishaPay checkout URL so the
        // user is redirected to the external payment panel.
        $postFields = [
            'gatewayMode' => config('maishapay.gateway_mode'),
            'publicApiKey' => $publicApiKey,
            'secretApiKey' => $secretApiKey,
            'montant' => $session->payment_amount,
            'devise' => $session->currency_code,
            'reference' => $session->reference,
            'page_callback_succes' => route('maishapay.success', ['reference' => $session->reference], true),
            'page_callback_success' => route('maishapay.success', ['reference' => $session->reference], true),
            'page_callback_faillure' => route('maishapay.failure', ['reference' => $session->reference], true),
            'page_callback_failure' => route('maishapay.failure', ['reference' => $session->reference], true),
            'page_callback_cancel' => route('maishapay.cancel', ['reference' => $session->reference], true),
            'success_url' => route('maishapay.success', ['reference' => $session->reference], true),
            'failure_url' => route('maishapay.failure', ['reference' => $session->reference], true),
            'cancel_url' => route('maishapay.cancel', ['reference' => $session->reference], true),
        ];

        $htmlFields = '';
        foreach ($postFields as $name => $value) {
            $htmlFields .= sprintf('<input type="hidden" name="%s" value="%s" />', e($name), e((string) $value));
        }

        $html = <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redirection vers MaishaPay</title>
</head>
<body>
    <p>Redirection vers MaishaPay...</p>
    <form id="maishapay-form" action="{$formAction}" method="post">
        {$htmlFields}
        <noscript><button type="submit">Payer</button></noscript>
    </form>
    <script>document.getElementById('maishapay-form').submit();</script>
</body>
</html>
HTML;

        return response($html, 200)->header('Content-Type', 'text/html');
    }

    public function success(Request $request): RedirectResponse
    {
        $reference = (string) $request->query('reference');
        $session = MaishaPaySession::where('reference', $reference)->first();

        if (! $session) {
            return redirect($this->frontendFailureUrl(null, $reference));
        }

        if ($session->status === 'success' && $session->vente_id) {
            return redirect($this->frontendSuccessUrl($session));
        }

        try {
            DB::transaction(function () use ($session) {
                if ($session->status !== 'success') {
                    $salePayload = $session->payload;
                    $salePayload['mode_paiement'] = 'card';
                    $salePayload['paiement_en_ligne'] = true;
                    $salePayload['frais_transaction'] = $session->frais_transaction;

                    if (empty($salePayload['paiements'])) {
                        $salePayload['paiements'] = [
                            [
                                'devise_id' => $session->devise_vente_id,
                                'montant' => $session->payment_amount,
                            ],
                        ];
                    }

                    $salePayload['code'] = $session->reference;

                    $venteController = app(VenteController::class);
                    $vente = $venteController->createSaleFromPayload(
                        $salePayload,
                        $salePayload['lignes'],
                        $salePayload['paiements'],
                    );

                    $session->vente_id = $vente->id;
                    $session->status = 'success';
                    $session->save();
                }
            });
        } catch (QueryException | \Throwable $exception) {
            Log::error('Erreur de création de vente MaishaPay : ' . $exception->getMessage(), [
                'reference' => $session->reference,
            ]);
            return redirect($this->frontendFailureUrl($session));
        }

        return redirect($this->frontendSuccessUrl($session));
    }

    public function failure(Request $request): RedirectResponse
    {
        $reference = (string) $request->query('reference');
        $session = MaishaPaySession::where('reference', $reference)->first();

        if ($session) {
            $session->update(['status' => 'failed']);
        }

        return redirect($this->frontendFailureUrl($session, $reference));
    }

    public function cancel(Request $request): RedirectResponse
    {
        $reference = (string) $request->query('reference');
        $session = MaishaPaySession::where('reference', $reference)->first();

        if ($session) {
            $session->update(['status' => 'cancelled']);
        }

        return redirect($this->frontendCancelUrl($session, $reference));
    }

    /**
     * Webhook endpoint for MaishaPay server-to-server notifications.
     * Verifies signature and updates session / creates sale when payment is confirmed.
     */
    public function webhook(Request $request): JsonResponse
    {
        $ok = $this->verifyMaishaPayCallback($request);
        if (! $ok) {
            Log::warning('MaishaPay webhook verification failed', ['ip' => $request->ip(), 'payload' => $request->all()]);
            return response()->json(['status' => 'error', 'message' => 'Invalid signature'], 403);
        }

        $reference = (string) ($request->input('reference') ?? $request->input('ref') ?? $request->input('receipt'));
        if ($reference === '') {
            return response()->json(['status' => 'error', 'message' => 'Missing reference'], 422);
        }

        $session = MaishaPaySession::where('reference', $reference)->first();
        if (! $session) {
            return response()->json(['status' => 'error', 'message' => 'Session not found'], 404);
        }

        $status = strtolower((string) ($request->input('status') ?? $request->input('result') ?? ''));

        if (in_array($status, ['success', 'completed', 'paid', 'ok'], true)) {
            if ($session->status === 'success' && $session->vente_id) {
                return response()->json(['status' => 'ok']);
            }

            try {
                DB::transaction(function () use ($session) {
                    $salePayload = $session->payload;
                    $salePayload['mode_paiement'] = 'card';
                    $salePayload['paiement_en_ligne'] = true;
                    $salePayload['frais_transaction'] = $session->frais_transaction;

                    if (empty($salePayload['paiements'])) {
                        $salePayload['paiements'] = [
                            [
                                'devise_id' => $session->devise_vente_id,
                                'montant' => $session->payment_amount,
                            ],
                        ];
                    }

                    $salePayload['code'] = $session->reference;

                    $venteController = app(VenteController::class);
                    $vente = $venteController->createSaleFromPayload(
                        $salePayload,
                        $salePayload['lignes'],
                        $salePayload['paiements'],
                    );

                    $session->vente_id = $vente->id;
                    $session->status = 'success';
                    $session->save();
                });
            } catch (\Throwable $e) {
                Log::error('Erreur en traitant webhook MaishaPay: ' . $e->getMessage(), ['reference' => $session->reference]);
                return response()->json(['status' => 'error', 'message' => 'Failed to create sale'], 500);
            }

            return response()->json(['status' => 'ok']);
        }

        if (in_array($status, ['failed', 'declined', 'cancelled', 'canceled'], true)) {
            $session->update(['status' => 'failed']);
            return response()->json(['status' => 'ok']);
        }

        // Unknown or pending status
        $session->update(['status' => 'pending']);
        return response()->json(['status' => 'ok', 'message' => 'Pending']);
    }

    /**
     * Verify incoming MaishaPay webhook/callback using HMAC-SHA256.
     * Supports signature in header or as POST parameter.
     */
    private function verifyMaishaPayCallback(Request $request): bool
    {
        $secret = config('maishapay.secret_api_key');
        if (! $secret) {
            Log::warning('MaishaPay secret key not configured');
            return false;
        }

        // 1) header-based signature (recommended)
        $headerNames = ['X-MaishaPay-Signature', 'X-Maishapay-Signature', 'X-Signature', 'X-Signature-Hmac'];
        foreach ($headerNames as $h) {
            $sig = $request->header($h);
            if ($sig) {
                $payload = $request->getContent();
                $expected = hash_hmac('sha256', $payload, $secret);
                if (hash_equals($expected, $sig) || hash_equals(base64_encode(hex2bin($expected) ?: ''), $sig)) {
                    return true;
                }
            }
        }

        // 2) parameter-based signature: sign concatenation of fields
        $sigParam = $request->input('signature') ?? $request->input('hash');
        if ($sigParam) {
            // Build canonical string: montant|devise|reference if present
            $parts = [];
            if ($request->filled('montant')) $parts[] = (string) $request->input('montant');
            if ($request->filled('devise')) $parts[] = (string) $request->input('devise');
            if ($request->filled('reference')) $parts[] = (string) $request->input('reference');

            $canonical = implode('|', $parts);
            $expected = hash_hmac('sha256', $canonical, $secret);
            if (hash_equals($expected, $sigParam) || hash_equals(base64_encode(hex2bin($expected) ?: ''), $sigParam)) {
                return true;
            }
        }

        return false;
    }

    private function frontendSuccessUrl(?MaishaPaySession $session): string
    {
        $reference = $session?->reference ?? 'unknown';
        $amount = $session?->payment_amount ?? 0;
        $frontendUrl = rtrim(config('maishapay.frontend_url'), '/');

        return sprintf(
            '%s/success?amount=%s&remaining=0&receipt=%s&payment_status=redirected',
            $frontendUrl,
            rawurlencode((string) $amount),
            rawurlencode($reference),
        );
    }

    private function frontendFailureUrl(?MaishaPaySession $session = null, string $reference = ''): string
    {
        $frontendUrl = rtrim(config('maishapay.frontend_url'), '/');
        $receipt = $session?->reference ?? $reference;

        return sprintf('%s/failure?reference=%s', $frontendUrl, rawurlencode($receipt));
    }

    private function frontendCancelUrl(?MaishaPaySession $session = null, string $reference = ''): string
    {
        $frontendUrl = rtrim(config('maishapay.frontend_url'), '/');
        $receipt = $session?->reference ?? $reference;

        return sprintf('%s/cancel?reference=%s', $frontendUrl, rawurlencode($receipt));
    }
}
