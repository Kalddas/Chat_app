<?php

namespace App\Http\Controllers\Api\Chat;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\MessageReaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReactionController extends Controller
{
    public function store(Request $request, $messageId)
    {
        $request->validate([
            'emoji' => 'required|string',
        ]);

        $message = Message::findOrFail($messageId);
        $user = Auth::user();

        $reaction = MessageReaction::create([
            'message_id' => $message->id,
            'user_id' => $user->id,
            'emoji' => $request->emoji,
        ]);

        return response()->json([
            'message' => 'Reaction added successfully',
            'data' => $reaction
        ], 201);
    }

    public function destroy($reactionId)
    {
        $reaction = MessageReaction::findOrFail($reactionId);

        if ($reaction->user_id !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $reaction->delete();

        return response()->json(['message' => 'Reaction removed successfully']);
    }
}
