<?php

namespace App\Events;

use App\Models\Messages;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public $message;

    public function __construct(Messages $message)
    {
        $this->message = $message->load('user','attachments');
    }

    public function broadcastOn(): Channel
    {
        return new PrivateChannel('conversation.' . $this->message->conversation_id);
    }

    public function broadcastAs()
    {
        return 'MessageSent';
    }

    public function broadcastWith()
    {
        return [
            'id' => $this->message->id,
            'message' => $this->message->message,
            'user_id' => $this->message->user_id,
            'user' => [
                'id' => $this->message->user->id,
                'name' => $this->message->user->name,
                // Add any other user fields you need
            ],
            'attachments' => $this->message->attachments->map(function ($attachment) {
                return [
                    'id' => $attachment->id,
                    'url' => asset('storage/' . ltrim($attachment->file_path, '/')),
                    'name' => basename($attachment->file_path),
                    'type' => $attachment->file_type,
                    'size' => $attachment->file_size,
                ];
            }),
            'created_at' => $this->message->created_at->toDateTimeString(),
            'conversation_id' => $this->message->conversation_id,
        ];
    }
}
