<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()
            ?->notifications()
            ->orderByDesc('created_at')
            ->get() ?? collect();

        return response()->json([
            'status' => 'success',
            'data' => $notifications,
        ]);
    }

    public function unread(Request $request): JsonResponse
    {
        $notifications = $request->user()
            ?->unreadNotifications()
            ->orderByDesc('created_at')
            ->get() ?? collect();

        return response()->json([
            'status' => 'success',
            'data' => $notifications,
        ]);
    }

    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()?->notifications()->whereKey($id)->firstOrFail();
        $notification->forceFill(['read_at' => now()])->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Notification marquée comme lue.',
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $notifiable = $request->user();

        if (! $notifiable) {
            return response()->json([
                'status' => 'error',
                'message' => 'Utilisateur non authentifié.',
            ], 401);
        }

        $updatedCount = $notifiable->unreadNotifications()->update(['read_at' => now()]);

        return response()->json([
            'status' => 'success',
            'message' => 'Toutes les notifications ont été marquées comme lues.',
            'updated_count' => $updatedCount,
        ]);
    }
}
