<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class CrudActionNotification extends Notification
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
            'type' => $this->details['type'] ?? 'crud_action',
            'title' => $this->details['title'] ?? 'Action enregistrée',
            'message' => $this->details['message'] ?? 'Une action a été enregistrée.',
            'action' => $this->details['action'] ?? null,
            'entity' => $this->details['entity'] ?? null,
            'entity_id' => $this->details['entity_id'] ?? null,
            'entity_name' => $this->details['entity_name'] ?? null,
            'actor_id' => $this->details['actor_id'] ?? null,
            'actor_name' => $this->details['actor_name'] ?? null,
        ];
    }
}