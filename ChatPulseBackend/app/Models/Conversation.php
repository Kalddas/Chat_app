<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    public function users()
    {
        return $this->belongsToMany(User::class, 'conversation_users');
    }

    public function messages()
    {
            return $this->hasMany(Message::class);
    }
    public function lastMessage()
    {
            return $this->hasOne(Message::class)->latestOfMany();
    }

}
