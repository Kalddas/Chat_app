<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Models\SuspendedUserMessage;
use App\Models\User;

class SuspendedUserMessageController extends Controller
{
    /**
     * Send a message to admin (suspended users only)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required|string|min:1|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        
        // Check if user is actually suspended
        $status = optional($user->profile)->status;
        if ($status !== 'Suspended') {
            return response()->json([
                'success' => false,
                'message' => 'Only suspended users can send messages to admin.'
            ], 403);
        }

        // Create the message
        $message = SuspendedUserMessage::create([
            'user_id' => $user->id,
            'message' => $request->input('message'),
            'is_read' => false,
        ]);

        Log::info('Message sent by suspended user', [
            'user_id' => $user->id,
            'message_id' => $message->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Your message has been sent to the admin successfully.',
            'data' => [
                'id' => $message->id,
                'message' => $message->message,
                'created_at' => $message->created_at,
            ]
        ], 201);
    }

    /**
     * Get user's messages (suspended users only)
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        // Check if user is suspended
        $status = optional($user->profile)->status;
        if ($status !== 'Suspended') {
            return response()->json([
                'success' => false,
                'message' => 'Only suspended users can view their messages.'
            ], 403);
        }
        
        $messages = SuspendedUserMessage::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'messages' => $messages->map(function ($message) {
                return [
                    'id' => $message->id,
                    'message' => $message->message,
                    'is_read' => $message->is_read,
                    'admin_response' => $message->admin_response,
                    'responded_at' => $message->responded_at,
                    'created_at' => $message->created_at,
                ];
            })
        ]);
    }
}

