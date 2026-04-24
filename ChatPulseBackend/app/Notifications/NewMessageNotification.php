<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use App\Models\Message;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Broadcast;

class NewMessageNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $message;

    /**
     * Create a new notification instance.
     */
    public function __construct(Message $message)
    {
        $this->message = $message;
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
        // Load sender relationship if not already loaded
        if (!$this->message->relationLoaded('sender')) {
            $this->message->load('sender');
        }
        
        $senderName = $this->message->sender?->profile?->first_name 
            ?? $this->message->sender?->email 
            ?? 'Someone';
        
        return [
            'type' => 'new_message',
            'message_id' => $this->message->id,
            'conversation_id' => $this->message->conversation_id,
            'sender_id' => $this->message->sender_id,
            'sender_name' => $senderName,
            'message_preview' => \Illuminate\Support\Str::limit($this->message->text ?? '', 100),
            'created_at' => now()->toDateTimeString(),
        ];
    }


    public function toBroadcast($notifiable)
    {
        // Load sender relationship if not already loaded
        if (!$this->message->relationLoaded('sender')) {
            $this->message->load('sender');
        }
        
        $senderName = $this->message->sender?->profile?->first_name 
            ?? $this->message->sender?->email 
            ?? 'Someone';
        
        return new BroadcastMessage([
            'type' => 'new_message',
            'message_id' => $this->message->id,
            'conversation_id' => $this->message->conversation_id,
            'sender_id' => $this->message->sender_id,
            'sender_name' => $senderName,
            'message_preview' => \Illuminate\Support\Str::limit($this->message->text ?? '', 100),
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
        // Load sender relationship if not already loaded
        if (!$this->message->relationLoaded('sender')) {
            $this->message->load('sender');
        }
        
        $senderName = $this->message->sender?->profile?->first_name 
            ?? $this->message->sender?->email 
            ?? 'Someone';
        
        return [
            'type' => 'new_message',
            'message_id' => $this->message->id,
            'conversation_id' => $this->message->conversation_id,
            'sender_id' => $this->message->sender_id,
            'sender_name' => $senderName,
            'message_preview' => \Illuminate\Support\Str::limit($this->message->text ?? '', 100),
        ];
    }
}
