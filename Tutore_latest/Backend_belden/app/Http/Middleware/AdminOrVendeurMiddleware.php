<?php

namespace App\Http\Middleware;

use App\Models\vendeurs;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AdminOrVendeurMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'message' => 'Non authentifié',
            ], 401);
        }

        $isVendeur = $user instanceof vendeurs || ($user->role ?? null) === 'vendeur';
        $isAdmin = ($user->role ?? null) === 'admin';

        if (!$isAdmin && !$isVendeur) {
            return response()->json([
                'message' => 'Accès non autorisé.',
            ], 403);
        }

        return $next($request);
    }
}