<?php

namespace App\Notifications;

use App\Models\ChatRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ChatRequestNotification extends Notification implements ShouldQueue
{
    use Queueable;
    public $chatRequest;

    /**
     * Create a new notification instance.
     */
    public function __construct(ChatRequest $chatRequest)
    {
        $this->chatRequest = $chatRequest;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via($notifiable): array
    {
        return ['database','broadcast'];
    }

     public function toDatabase($notifiable)
    {
        return [
            'type' => 'chat_request',
            'request_id' => $this->chatRequest->id,
            'sender_id' => $this->chatRequest->sender_id,
            'created_at' => now()->toDateTimeString(),
        ];
    }

    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage([
            'type' => 'chat_request',
            'request_id' => $this->chatRequest->id,
            'sender_id' => $this->chatRequest->sender_id,
            'created_at' => now()->toDateTimeString(),
        ]);
    }
}
