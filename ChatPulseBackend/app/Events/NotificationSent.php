<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $notification;

    /**
     * Create a new event instance.
     */
    public function __construct($notification)
    {
        $this->notification = $notification;
    }


    public function broadcastOn(): Channel
    {
        return new Channel('notifications.' . $this->notification['receiver_id']);
    }


    public function broadcastWith(){
        return [
            'id' => $this->notification['id'],
            'type' => $this->notification['type'],
            'message' => $this->notification['message'],
            'sender_id' => $this->notification['sender_id'],
            'receiver_id' => $this->notification['receiver_id'],
            'conversation_id' => $this->notification['conversation_id'] ?? null,
            'created_at' => $this->notification['created_at'],
        ];
    }
}
