<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class StockRuptureReminderNotification extends Notification
{
    use Queueable;

    public function __construct(public array $details)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $products = $this->details['products'] ?? [];

        return [
            'type' => 'stock_rupture_reminder',
            'title' => 'Rappel d’approvisionnement',
            'message' => $this->details['message'] ?? 'Des produits sont en rupture de stock.',
            'count' => $this->details['count'] ?? count($products),
            'products' => $products,
            'generated_at' => now()->toISOString(),
        ];
    }
}