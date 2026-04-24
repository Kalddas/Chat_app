<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    /** @use HasFactory<\Database\Factories\MessageFactory> */
    use HasFactory;

    protected $guarded = [];

    public function conversation() {
        return $this->belongsTo(Conversation::class);
    }

    public function attachments() {
        return $this->hasMany(Attachment::class);
    }

    public function sender() {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver() {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function reactions() {
        return $this->hasMany(MessageReaction::class);
    }

    public function replyTo() {
        return $this->belongsTo(Message::class, 'reply_to_id');
    }
}
