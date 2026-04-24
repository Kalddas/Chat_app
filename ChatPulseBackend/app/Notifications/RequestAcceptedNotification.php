<?php

namespace App\Notifications;

use App\Models\ChatRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RequestAcceptedNotification extends Notification implements ShouldQueue
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

     public function via($notifiable)
    {
        // Only use database for now (broadcast requires WebSocket server running)
        return ['database'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'type' => 'request_accepted',
            'request_id' => $this->chatRequest->id,
            'conversation_id' => $this->chatRequest->conversation_id,
            'acceptor_id' => $this->chatRequest->receiver_id,
            'created_at' => now()->toDateTimeString(),
        ];
    }

    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage([
            'type' => 'request_accepted',
            'request_id' => $this->chatRequest->id,
            'conversation_id' => $this->chatRequest->conversation_id,
            'acceptor_id' => $this->chatRequest->receiver_id,
            'created_at' => now()->toDateTimeString(),
        ]);
    }
}
