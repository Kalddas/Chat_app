<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Conversation;
use Illuminate\Support\Facades\Log;



Broadcast::channel('chat.{conversationId}', function ($user, $conversationId) {
    // Find the conversation
    $conversation = Conversation::find($conversationId);

    if (!$conversation) {
        return false;
    }

    // Check if user exists in the pivot table 'conversation_users'
    return $conversation->users()->where('user_id', $user->id)->exists();
});

Broadcast::channel('presence-chat.{conversationId}', function ($user, $conversationId) {
    $conversation = Conversation::find($conversationId);

    if ($conversation && $conversation->users()->where('user_id', $user->id)->exists()) {
        return [
            'id' => $user->id,
            'name' => $user->profile->first_name ?? $user->name ?? 'Unknown',
            // any additional info you want
        ];
    }

    return false; // not authorized
});




Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Broadcast::channel('private-chat.{userId}', function ($user, $userId) {
//     return (int) $user->id == (int) $userId;
// });

// Broadcast::channel('conversation.{id}', function ($user, $id) {
//     return $user->conversations()->where('id', $id)->exists();
// });


// Broadcast::channel('presence-chat.{chatId}', function ($user, $chatId) {
//     Log::info('Broadcast auth attempt', ['user' => $user, 'chatId' => $chatId]);

//     return [
//         'id' => $user->id,
//         'name' => $user->name,
//     ];
// });
