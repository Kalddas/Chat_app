<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\ChatRequest;
use App\Models\Conversation;
use App\Models\Messages;

class DeleteAccountController extends Controller
{
    public function deleteAccount(Request $request)
    {
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();

        // Verify password
        if (!\Illuminate\Support\Facades\Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Password is incorrect'
            ], 400);
        }

        try {
            // Delete related data
            // Delete chat requests sent by this user
            ChatRequest::where('sender_id', $user->id)->delete();
            // Delete chat requests received by this user
            ChatRequest::where('receiver_id', $user->id)->delete();

            // Delete conversations - get conversation IDs first
            $conversationIds = $user->conversations()->pluck('conversation_id');
            
            // Delete messages in those conversations
            Messages::whereIn('conversation_id', $conversationIds)->delete();
            
            // Delete conversations
            $user->conversations()->detach();
            Conversation::whereIn('id', $conversationIds)->delete();

            // Delete user profile
            if ($user->profile) {
                $user->profile->delete();
            }

            // Delete user tags relationships
            $user->tags()->detach();

            // Delete tokens
            $user->tokens()->delete();

            // Delete the user account
            $user->delete();

            // Logout
            Auth::logout();

            return response()->json([
                'success' => true,
                'message' => 'Account deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete account: ' . $e->getMessage()
            ], 500);
        }
    }
}
