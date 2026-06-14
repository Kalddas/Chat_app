<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */

    public $message;
    public $userId;

    public function __construct($message)
    {
        $this->message = $message;
        // $this->userId = $userId;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('chat.' . $this->message->conversation_id),
        ];
    }

    /**
     * Lightweight payload only — never send file data over WebSocket.
     */
    public function broadcastWith(): array
    {
        $attachmentCount = $this->message->relationLoaded('attachments')
            ? $this->message->attachments->count()
            : $this->message->attachments()->count();

        return [
            'message_id' => $this->message->id,
            'conversation_id' => $this->message->conversation_id,
            'sender_id' => $this->message->sender_id,
            'has_attachments' => $attachmentCount > 0,
            'attachment_count' => $attachmentCount,
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }
}
