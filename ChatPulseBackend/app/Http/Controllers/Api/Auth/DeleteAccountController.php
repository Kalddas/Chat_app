<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\Attachment;
use App\Models\ChatRequest;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class DeleteAccountController extends Controller
{
    public function deleteAccount(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        $passwordValid = Hash::check($request->password, $user->password);
        if (!$passwordValid && $user->temporary_password) {
            $passwordValid = Hash::check($request->password, $user->temporary_password);
        }

        if (!$passwordValid) {
            return response()->json([
                'success' => false,
                'message' => 'Password is incorrect',
            ], 400);
        }

        try {
            DB::transaction(function () use ($user) {
                $userId = $user->id;

                $conversationIds = DB::table('conversation_users')
                    ->where('user_id', $userId)
                    ->pluck('conversation_id');

                $messageIds = Message::where('sender_id', $userId)->pluck('id');

                Attachment::whereIn('message_id', $messageIds)->each(function (Attachment $attachment) {
                    if ($attachment->file_path) {
                        Storage::disk('public')->delete($attachment->file_path);
                    }
                    $attachment->delete();
                });

                Message::where('sender_id', $userId)->delete();

                DB::table('conversation_users')->where('user_id', $userId)->delete();

                foreach ($conversationIds as $conversationId) {
                    $remainingParticipants = DB::table('conversation_users')
                        ->where('conversation_id', $conversationId)
                        ->count();

                    if ($remainingParticipants === 0) {
                        Message::where('conversation_id', $conversationId)->delete();
                        Conversation::where('id', $conversationId)->delete();
                    }
                }

                ChatRequest::where('sender_id', $userId)
                    ->orWhere('receiver_id', $userId)
                    ->delete();

                if ($user->profile?->profile_image) {
                    Storage::disk('public')->delete($user->profile->profile_image);
                }

                $user->tags()->detach();
                $user->tokens()->delete();

                if ($user->profile) {
                    $user->profile->delete();
                }

                if ($user->admin) {
                    $user->admin->delete();
                }

                $user->delete();
            });

            return response()->json([
                'success' => true,
                'message' => 'Account deleted successfully',
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to delete account', [
                'user_id' => $user->id ?? null,
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete account. Please try again.',
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
