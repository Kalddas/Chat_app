<?php

namespace App\Http\Controllers;

use App\Events\ChatEvent;
use App\Models\ChatRequest;
use App\Models\Attachment;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Notifications\NewMessageNotification;
use App\Notifications\RequestAcceptedNotification;
use App\Notifications\ChatRequestNotification;
use App\Notifications\MessageDeletedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    public function chatView($conversationId)
    {
        $conversation = Conversation::with(['messages.sender.profile'])
            ->findOrFail($conversationId);

        $messages = $conversation->messages()->with('sender.profile')->get();

        return view('chat.view', [
            'conversation' => $conversation,
            'messages' => $messages,
        ]);
    }

    // show all messages
    public function fetchMessages($conversationId)
    {
        /** @var User */
        $user = Auth::user();
        $conversation = Conversation::findOrFail($conversationId);

        if (!$conversation->users()->where('user_id', $user->id)->exists()) {
            return response()->json(['error' => 'User not in this conversation'], 403);
        }

        $messages = Message::where('conversation_id', $conversationId)
            ->with(['sender.profile', 'receiver', 'attachments', 'reactions', 'replyTo.sender.profile'])
            ->orderBy('created_at', 'asc')
            ->paginate(50);

        return response()->json($messages->map(function ($msg) use ($user) {
            // Only show read_at if the sender has read receipts enabled
            $showReadStatus = $msg->sender && $msg->sender->read_receipts_enabled;
            
            return [
                'id' => $msg->id,
                'sender' => [
                    'id' => $msg->sender->id,
                    'first_name' => $msg->sender->profile?->first_name,
                    'last_name' => $msg->sender->profile?->last_name,
                    'profile_picture_url' => $msg->sender->profile_picture_url,
                ],
                'receiver_id' => $msg->receiver_id,
                'message' => $msg->text,
                'read_at' => $showReadStatus ? $msg->read_at : null,
                'attachments' => $msg->attachments->map(fn($attachment) => [
                    'id' => $attachment->id,
                    'url' => asset('storage/' . $attachment->file_path),
                    'type' => $attachment->file_type,
                    'size' => $attachment->file_size,
                ]),
                'reactions' => $msg->reactions->map(fn($reaction) => [
                    'id' => $reaction->id,
                    'user_id' => $reaction->user_id,
                    'emoji' => $reaction->emoji,
                ]),
                'reply_to' => $msg->replyTo ? [
                    'id' => $msg->replyTo->id,
                    'message' => $msg->replyTo->text,
                    'sender_name' => $msg->replyTo->sender->profile?->first_name ?? 'Unknown',
                ] : null,
                'created_at' => $msg->created_at,
            ];
        }));
    }

    // sending(creating) a new message - UPDATED
    public function sendMessage(Request $request, $conversationId)
    {
        Log::info('VIDEO UPLOAD: Request received', [
            'conversation_id' => $conversationId,
            'has_files' => $request->hasFile('attachments'),
            'file_count' => $request->hasFile('attachments') ? count($request->file('attachments')) : 0
        ]);
        
        $request->validate([
            'text' => 'nullable|string',
            'receiver_id' => 'required|exists:users,id',
            'reply_to_id' => 'nullable|exists:messages,id',
            // Allow large files (e.g. movies, books) up to ~500MB each (also limited by php.ini)
            'attachments.*' => 'file|max:512000',
        ]);

        // Require at least text or one attachment
        if (!$request->filled('text') && !$request->hasFile('attachments')) {
            return response()->json([
                'error' => 'Message text or at least one attachment is required',
            ], 422);
        }

        $user = Auth::user();
        $receiverId = (int) $request->input('receiver_id');

        // Block check: prevent sending messages if either user has blocked the other
        if ($this->isBlockedBetween($user->id, $receiverId)) {
            return response()->json([
                'error' => 'You cannot send messages to this user because one of you has blocked the other.',
            ], 403);
        }

        $conversation = Conversation::findOrFail($conversationId);

        try {
            $message = Message::create([
                'sender_id'      => $user->id,
                'receiver_id'    => $request->input('receiver_id'),
                'conversation_id' => $conversationId,
                'text'           => $request->input('text', ''),
                'reply_to_id'    => $request->input('reply_to_id'),
            ]);

            // Handle file attachments (optional)
            if ($request->hasFile('attachments')) {
                foreach ((array) $request->file('attachments') as $uploadedFile) {
                    if (!$uploadedFile) {
                        continue;
                    }
                    $path = $uploadedFile->store('attachments', 'public');

                    $message->attachments()->create([
                        'file_path' => $path,
                        'file_type' => $uploadedFile->getClientMimeType(),
                        'file_size' => $uploadedFile->getSize(),
                    ]);
                }
            }

            // Broadcast event (do not fail the request if broadcasting fails locally)
            try {
                event(new ChatEvent($message));
            } catch (\Throwable $broadcastException) {
                Log::warning('Broadcast failed (non-fatal): ' . $broadcastException->getMessage());
            }

            // Notify other participants
            $otherParticipants = $conversation->users()
                ->where('users.id', '!=', $user->id)
                ->get();
            
            // Load sender & attachments relationship before sending notifications / response
            $message->load(['sender', 'attachments']);

            foreach ($otherParticipants as $participant) {
                try {
                    $participant->notify(new NewMessageNotification($message));
                } catch (\Throwable $notifException) {
                    Log::warning('Notification failed (non-fatal) for user ' . $participant->id . ': ' . $notifException->getMessage());
                }
            }

            // Normalize message for frontend
            $normalizedMessage = [
                'id' => $message->id,
                'clientId' => "server-{$message->id}",
                'message' => $message->text,
                'timestamp' => $message->created_at->toDateTimeString(),
                'sender' => [
                    'id' => $user->id,
                    'name' => $user->profile?->first_name ?? 'Unknown',
                ],
                'temp' => false,
                'edited' => $message->edited ?? false,
                'deleted' => false,
                'reply_to' => $message->replyTo ? [
                    'id' => $message->replyTo->id,
                    'message' => $message->replyTo->text,
                    'sender_name' => $message->replyTo->sender->profile?->first_name ?? 'Unknown',
                ] : null,
                'attachments' => $message->attachments->map(function ($attachment) {
                    return [
                        'id' => $attachment->id,
                        'url' => asset('storage/' . $attachment->file_path),
                        'type' => $attachment->file_type,
                        'size' => $attachment->file_size,
                    ];
                })->toArray(),
            ];

            return response()->json([
                'message' => 'The message sent successfully.',
                'data'    => $normalizedMessage
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to save message: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to save message: ' . $e->getMessage()], 500);
        }
    }

    // editing message
    public function editMessage(Request $request, $message_id)
    {
        $user = Auth::user();
        $message = Message::findOrFail($message_id);

        if ($message->sender_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'text' => 'required|string'
        ]);

        $message->update([
            'text' => $request->input('text'),
            'edited' => true
        ]);

        return response()->json([
            'message' => 'The message updated successfully.',
            'data' => [
                'id' => $message->id,
                'message' => $message->text,
                'edited' => true
            ]
        ], 200);
    }

    // deleting message
    public function deleteMessage($message_id)
    {
        $user = Auth::user();
        $message = Message::with('conversation')->findOrFail($message_id);
        
        if ($message->sender_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Get conversation and participants before deleting
        $conversation = $message->conversation;
        
        // Get other participants before deleting
        $otherParticipants = [];
        if ($conversation) {
            $otherParticipants = $conversation->users()
                ->where('users.id', '!=', $user->id)
                ->get();
        }
        
        // Delete the message
        $message->delete();

        // Notify other participants in the conversation
        try {
            foreach ($otherParticipants as $participant) {
                $participant->notify(new MessageDeletedNotification($message, $user->id));
            }
        } catch (\Exception $e) {
            Log::warning('Failed to send delete notifications: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'The message deleted successfully.'
        ]);
    }

    private function getMessagePreview($message)
    {
        if (!$message) return null;
        
        $text = trim($message->text);
        if ($text !== '') return $text;

        // If no text, check attachments
        if ($message->attachments->count() > 0) {
            $first = $message->attachments->first();
            if (str_contains($first->file_type, 'image')) return '[Image]';
            if (str_contains($first->file_type, 'video')) return '[Video]';
            if (str_contains($first->file_type, 'audio')) return '[Audio]';
            return '[Attachment]';
        }

        return '';
    }

    public function sendChatRequest(Request $request)
    {
        Log::info("Chat request received", ['request' => $request->all(), 'user' => Auth::user()]);
        
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
        ]);

        /** @var User */
        $user = Auth::user();
        $receiverId = (int) $request->receiver_id;
        
        // Prevent users from sending requests to themselves
        if ($user->id == $receiverId) {
            return response()->json(['error' => 'Cannot send request to yourself'], 400);
        }
        
        // Prevent sending requests to admin users
        $receiver = User::find($receiverId);
        if (!$receiver) {
            return response()->json(['error' => 'Receiver not found'], 404);
        }
        if ($receiver->role === 'admin') {
            return response()->json(['error' => 'Cannot send request to admin users'], 400);
        }

        // Block check: prevent requests if either user has blocked the other
        if ($this->isBlockedBetween($user->id, $receiverId)) {
            return response()->json(['error' => 'You cannot send a request to this user because one of you has blocked the other.'], 403);
        }
        
        Log::info("Processing chat request", ['sender' => $user->id, 'receiver' => $receiverId]);

        $existingRequest = ChatRequest::where('sender_id', $user->id)
            ->where('receiver_id', $receiverId)
            ->orWhere(function ($query) use ($user, $receiverId) {
                $query->where('sender_id', $receiverId)->where('receiver_id', $user->id);
            })->first();

        if ($existingRequest) {
            return response()->json(['error' => 'A request already exists or was previously handled', 'status' => $existingRequest->status], 400);
        }

        $chatRequest = ChatRequest::create([
            'sender_id' => $user->id,
            'receiver_id' => $receiverId,
            'status' => 'pending',
        ]);

        // Send notification to receiver
        $receiver = User::find($receiverId);
        $receiver->notify(new ChatRequestNotification($chatRequest));

        return response()->json(['request_id' => $chatRequest->id, 'message' => 'Chat request sent successfully']);
    }

    public function acceptRequest($requestId)
    {
        /** @var User */
        $user = Auth::user();

        $chatRequest = ChatRequest::findOrFail($requestId);

        if ($chatRequest->receiver_id != $user->id) {
            return response()->json(['error' => 'Only the receiver can accept this request'], 403);
        }

        if ($chatRequest->status != 'pending') {
            return response()->json(['error' => 'This request has already been handled'], 400);
        }

        $chatRequest->update(['status' => 'accepted']);
        $conversation = Conversation::create();
        $conversation->users()->attach([$chatRequest->sender_id, $chatRequest->receiver_id]);
        $chatRequest->update(['conversation_id' => $conversation->id]);

        $sender = User::find($chatRequest->sender_id);
        $sender->notify(new RequestAcceptedNotification($chatRequest));

        return response()->json([
            'conversation_id' => $conversation->id,
            'message' => 'Chat request accepted, conversation created',
        ]);
    }

    public function rejectRequest($requestId)
    {
        /** @var User */
        $user = Auth::user();

        $chatRequest = ChatRequest::findOrFail($requestId);

        if ($chatRequest->receiver_id != $user->id) {
            return response()->json(['error' => 'Only the receiver can reject this request'], 403);
        }

        if ($chatRequest->status != 'pending') {
            return response()->json(['error' => 'This request has already been handled'], 400);
        }

        $chatRequest->update(['status' => 'rejected']);

        return response()->json(['message' => 'Chat request rejected']);
    }

    public function chatlist()
    {
        $user = Auth::user();

        $acceptedRequests = ChatRequest::where(function ($q) use ($user) {
            $q->where('sender_id', $user->id)
                ->orWhere('receiver_id', $user->id);
        })
            ->where('status', 'accepted')
            ->with([
                'sender.profile',
                'receiver.profile',
                'conversation.lastMessage.sender.profile'
            ])
            ->paginate(10);

        $chatList = $acceptedRequests->map(function ($req) use ($user) {
            $otherUser = $req->sender_id == $user->id ? $req->receiver : $req->sender;

            return [
                'conversation_id' => $req->conversation_id,
                'user' => [
                    'id' => $otherUser->id,
                    'first_name' => $otherUser->profile?->first_name ?? null,
                    'last_name' => $otherUser->profile?->last_name ?? null,
                    'user_name' => $otherUser->profile?->user_name ?? null,
                    'phone' => $otherUser->profile?->phone ?? null,
                    'profile_picture_url' => $otherUser->profile_picture_url,
                    'is_online' => $otherUser->isOnline(),
                    'online_status' => $otherUser->getOnlineStatusText(),
                    'last_seen_at' => $otherUser->show_online_status ? $otherUser->last_seen_at?->toDateTimeString() : null,
                ],
                'last_message' => $req->conversation && $req->conversation->lastMessage
                    ? [
                        'id' => $req->conversation->lastMessage->id,
                        'message' => $this->getMessagePreview($req->conversation->lastMessage),
                        'sent_by' => [
                            'id' => $req->conversation->lastMessage->sender->id,
                            'user_name' => $req->conversation->lastMessage->sender->profile?->user_name ?? null,
                        ],
                        'sent_at' => $req->conversation->lastMessage->created_at->toDateTimeString(),
                    ]
                    : null,
                'unread_count' => $req->conversation 
                    ? $req->conversation->messages()
                        ->where('receiver_id', $user->id)
                        ->whereNull('read_at')
                        ->count()
                    : 0,
            ];
        });

        return response()->json([
            'user_id' => $user->id,
            'chats' => $chatList,
        ]);
    }

    // delete conversation (only participants can delete)
    public function deleteConversation($conversationId)
    {
        /** @var User */
        $authUser = Auth::user();

        $conversation = Conversation::findOrFail($conversationId);

        // Ensure the authenticated user is a participant
        $isParticipant = $conversation->users()
            ->where('user_id', $authUser->id)
            ->exists();

        if (!$isParticipant) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        // Delete related messages, detach participants, then delete conversation
        $conversation->messages()->delete();
        $conversation->users()->detach();
        $conversation->delete();

        return response()->json([
            'message' => 'Conversation deleted successfully',
            'conversation_id' => (int) $conversationId,
        ]);
    }

    public function markAsRead($conversationId)
    {
        /** @var User */
        $authUser = Auth::user();

        $conversation = Conversation::findOrFail($conversationId);

        // Ensure the authenticated user is a participant
        $isParticipant = $conversation->users()
            ->where('user_id', $authUser->id)
            ->exists();

        if (!$isParticipant) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        // Only mark as read if user has read receipts enabled
        if ($authUser->read_receipts_enabled) {
            // Mark all messages as read where user is the receiver
            $conversation->messages()
                ->where('receiver_id', $authUser->id)
                ->whereNull('read_at')
                ->update(['read_at' => now()]);
        }

        return response()->json([
            'message' => 'Messages marked as read successfully',
            'conversation_id' => (int) $conversationId,
            'read_receipts_enabled' => $authUser->read_receipts_enabled,
        ]);
    }

    // list conversations for a specific user (must be the authenticated user)
    public function listUserConversations($userId)
    {
        try {
            /** @var User */
            $authUser = Auth::user();

            if ((int) $authUser->id !== (int) $userId) {
                return response()->json(['error' => 'Forbidden'], 403);
            }

            $conversations = Conversation::whereHas('users', function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                })
                ->with([
                    'lastMessage.sender.profile',
                    'users.profile',
                ])
                ->orderByDesc(
                    // order by last message time if available, else by id
                    Message::select('created_at')
                        ->whereColumn('messages.conversation_id', 'conversations.id')
                        ->latest()
                        ->take(1)
                )
                ->get();

        $result = $conversations->map(function ($conv) use ($authUser) {
            $otherUser = $conv->users->firstWhere('id', '!=', $authUser->id) ?? $authUser;

            return [
                'conversation_id' => $conv->id,
                'user' => [
                    'id' => $otherUser->id,
                    'first_name' => $otherUser->profile?->first_name,
                    'last_name' => $otherUser->profile?->last_name,
                    'user_name' => $otherUser->profile?->user_name,
                    'phone' => $otherUser->profile?->phone,
                    'bio' => $otherUser->profile?->bio,
                    'profile_picture_url' => $otherUser->profile_picture_url,
                    'mood' => $otherUser->mood,
                    'mood_updated_at' => $otherUser->mood_updated_at?->toDateTimeString(),
                    'is_online' => $otherUser->isOnline(),
                    'online_status' => $otherUser->getOnlineStatusText(),
                    'last_seen_at' => $otherUser->show_online_status ? $otherUser->last_seen_at?->toDateTimeString() : null,
                ],
                'last_message' => $conv->lastMessage ? [
                    'id' => $conv->lastMessage->id,
                    'message' => $this->getMessagePreview($conv->lastMessage),
                    'sent_by' => [
                        'id' => $conv->lastMessage->sender->id,
                        'user_name' => $conv->lastMessage->sender->profile?->user_name,
                    ],
                    'sent_at' => $conv->lastMessage->created_at->toDateTimeString(),
                ] : null,
                'unread_count' => $conv->messages()
                    ->where('receiver_id', $authUser->id)
                    ->whereNull('read_at')
                    ->count(),
            ];
        });

            return response()->json([
                'user_id' => (int) $userId,
                'conversations' => $result,
            ]);
        } catch (\Exception $e) {
            Log::error('List conversations error: ' . $e->getMessage());
            return response()->json([
                'user_id' => (int) $userId,
                'conversations' => [],
                'error' => 'Failed to load conversations. Please ensure database migrations are run.'
            ], 500);
        }
    }

    public function listReceivedRequests()
    {
        /** @var User */
        $user = Auth::user();

        $receivedRequests = ChatRequest::where('receiver_id', $user->id)
            ->where('status', 'pending')
            ->with(['sender.profile'])
            ->get();

        $requests = $receivedRequests->map(function ($request) {
            return [
                'request_id' => $request->id,
                'sender_id' => $request->sender_id,
                'sender_name' => $request->sender->profile?->first_name . ' ' . $request->sender->profile?->last_name,
                'user_name' => $request->sender->profile?->user_name,
                'profile_picture_url' => $request->sender->profile_picture_url,
                'status' => $request->status,
                'created_at' => $request->created_at,
            ];
        });

        return response()->json($requests);
    }

    public function getAllChatRequests()
    {
        $requests = ChatRequest::with(['sender.profile', 'receiver.profile'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($requests);
    }

    /**
     * Block another user (prevent messages and chat requests in both directions).
     */
    public function blockUser(Request $request)
    {
        /** @var User */
        $user = Auth::user();

        try {
            $data = $request->validate([
                'user_id' => 'required|exists:users,id',
            ]);

            $targetId = (int) $data['user_id'];

            if ($targetId === $user->id) {
                return response()->json(['error' => 'You cannot block yourself.'], 400);
            }

            // Create or update block relation
            DB::table('user_blocks')->updateOrInsert(
                ['blocker_id' => $user->id, 'blocked_user_id' => $targetId],
                ['updated_at' => now(), 'created_at' => now()]
            );

            return response()->json(['message' => 'User blocked successfully.']);
        } catch (\Throwable $e) {
            Log::error('Failed to block user', [
                'auth_user_id' => $user->id ?? null,
                'request_user_id' => $request->input('user_id'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to block user: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Unblock a previously blocked user.
     */
    public function unblockUser(Request $request)
    {
        /** @var User */
        $user = Auth::user();

        try {
            $data = $request->validate([
                'user_id' => 'required|exists:users,id',
            ]);

            $targetId = (int) $data['user_id'];

            DB::table('user_blocks')
                ->where('blocker_id', $user->id)
                ->where('blocked_user_id', $targetId)
                ->delete();

            return response()->json(['message' => 'User unblocked successfully.']);
        } catch (\Throwable $e) {
            Log::error('Failed to unblock user', [
                'auth_user_id' => $user->id ?? null,
                'request_user_id' => $request->input('user_id'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to unblock user: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Helper to check if either user has blocked the other.
     */
    private function isBlockedBetween(int $userId, int $otherUserId): bool
    {
        if ($userId === $otherUserId) {
            return false;
        }

        try {
            return DB::table('user_blocks')
                ->where(function ($q) use ($userId, $otherUserId) {
                    $q->where('blocker_id', $userId)
                      ->where('blocked_user_id', $otherUserId);
                })
                ->orWhere(function ($q) use ($userId, $otherUserId) {
                    $q->where('blocker_id', $otherUserId)
                      ->where('blocked_user_id', $userId);
                })
                ->exists();
        } catch (\Throwable $e) {
            // If the table does not exist or another DB error occurs,
            // treat as "not blocked" but log the problem.
            Log::error('Block check failed', [
                'user_id' => $userId,
                'other_user_id' => $otherUserId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }
}
