<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatRequest extends Model
{
    protected $fillable = ['sender_id', 'receiver_id', 'conversation_id', 'status'];


    public function conversation()
    {
        return $this->belongsTo(Conversation::class, 'conversation_id');
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }
}
