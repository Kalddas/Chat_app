<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use App\Models\Message;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class MessageDeletedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $message;
    public $deleterId;

    /**
     * Create a new notification instance.
     */
    public function __construct(Message $message, $deleterId)
    {
        $this->message = $message;
        $this->deleterId = $deleterId;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via($notifiable): array
    {
        // Only use database for now (broadcast requires WebSocket server running)
        // To enable real-time: start WebSocket server and add 'broadcast' to array
        return ['database'];
    }

    /**
     * Get the database representation of the notification.
     */
    public function toDatabase($notifiable)
    {
        $deleter = \App\Models\User::find($this->deleterId);
        return [
            'type' => 'message_deleted',
            'message_id' => $this->message->id,
            'conversation_id' => $this->message->conversation_id,
            'deleter_id' => $this->deleterId,
            'deleter_name' => $deleter->profile?->first_name ?? $deleter->email ?? 'Unknown',
            'message_preview' => \Illuminate\Support\Str::limit($this->message->text, 100),
            'created_at' => now()->toDateTimeString(),
        ];
    }

    public function toBroadcast($notifiable)
    {
        $deleter = \App\Models\User::find($this->deleterId);
        return new BroadcastMessage([
            'type' => 'message_deleted',
            'message_id' => $this->message->id,
            'conversation_id' => $this->message->conversation_id,
            'deleter_id' => $this->deleterId,
            'deleter_name' => $deleter->profile?->first_name ?? $deleter->email ?? 'Unknown',
            'message_preview' => \Illuminate\Support\Str::limit($this->message->text, 100),
            'created_at' => now()->toDateTimeString(),
        ]);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $deleter = \App\Models\User::find($this->deleterId);
        return [
            'type' => 'message_deleted',
            'message_id' => $this->message->id,
            'conversation_id' => $this->message->conversation_id,
            'deleter_id' => $this->deleterId,
            'deleter_name' => $deleter->profile?->first_name ?? $deleter->email ?? 'Unknown',
            'message_preview' => \Illuminate\Support\Str::limit($this->message->text, 100),
        ];
    }
}

