<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Notification;

class StockInsuffisantNotification extends Notification
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
        return [
            'type' => 'stock_insuffisant',
            'title' => 'Stock insuffisant pour une vente',
            'message' => $this->details['message'] ?? 'Le stock est insuffisant pour finaliser la vente.',
            'vente_code' => $this->details['vente_code'] ?? null,
            'items' => $this->details['items'] ?? [],
            'created_by' => $this->details['created_by'] ?? null,
            'created_by_name' => $this->details['created_by_name'] ?? null,
        ];
    }
}
