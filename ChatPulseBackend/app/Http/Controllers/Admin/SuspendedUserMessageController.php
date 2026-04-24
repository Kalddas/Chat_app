<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\SuspendedUserMessage;
use App\Models\User;

class SuspendedUserMessageController extends Controller
{
    /**
     * Get all messages from suspended users (admin only)
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        // Check if user is admin
        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

            $query = SuspendedUserMessage::with([
                'user' => function($q) {
                    $q->with('profile');
                },
                'responder' => function($q) {
                    $q->with('profile');
                }
            ])
            ->orderBy('created_at', 'desc');

        // Filter by read/unread status
        if ($request->has('is_read')) {
            $query->where('is_read', $request->boolean('is_read'));
        }

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        try {
            $messages = $query->paginate(20);

            return response()->json([
                'success' => true,
                'messages' => $messages->map(function ($message) {
                    return [
                        'id' => $message->id,
                        'message' => $message->message,
                        'is_read' => $message->is_read,
                        'read_at' => $message->read_at,
                        'admin_response' => $message->admin_response,
                        'responded_at' => $message->responded_at,
                        'user' => [
                            'id' => $message->user->id ?? null,
                            'email' => $message->user->email ?? null,
                            'first_name' => optional($message->user->profile)->first_name ?? null,
                            'last_name' => optional($message->user->profile)->last_name ?? null,
                            'user_name' => optional($message->user->profile)->user_name ?? null,
                        ],
                        'created_at' => $message->created_at,
                    ];
                }),
                'pagination' => [
                    'current_page' => $messages->currentPage(),
                    'last_page' => $messages->lastPage(),
                    'per_page' => $messages->perPage(),
                    'total' => $messages->total(),
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching suspended messages', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching messages.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark a message as read (admin only)
     */
    public function markAsRead(Request $request, $id)
    {
        $user = Auth::user();
        
        // Check if user is admin
        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        $message = SuspendedUserMessage::findOrFail($id);

        if (!$message->is_read) {
            $message->update([
                'is_read' => true,
                'read_by' => $user->id,
                'read_at' => now(),
            ]);

            Log::info('Message marked as read by admin', [
                'admin_id' => $user->id,
                'message_id' => $message->id,
                'user_id' => $message->user_id,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Message marked as read.',
            'data' => [
                'id' => $message->id,
                'is_read' => $message->is_read,
                'read_at' => $message->read_at,
            ]
        ]);
    }

    /**
     * Mark all messages as read (admin only)
     */
    public function markAllAsRead(Request $request)
    {
        $user = Auth::user();
        
        // Check if user is admin
        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        $count = SuspendedUserMessage::where('is_read', false)
            ->update([
                'is_read' => true,
                'read_by' => $user->id,
                'read_at' => now(),
            ]);

        Log::info('All messages marked as read by admin', [
            'admin_id' => $user->id,
            'count' => $count,
        ]);

        return response()->json([
            'success' => true,
            'message' => "All messages marked as read.",
            'count' => $count
        ]);
    }

    /**
     * Get unread message count (admin only)
     */
    public function unreadCount(Request $request)
    {
        $user = Auth::user();
        
        // Check if user is admin
        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        $count = SuspendedUserMessage::where('is_read', false)->count();

        return response()->json([
            'success' => true,
            'count' => $count
        ]);
    }

    /**
     * Send a response to a suspended user message (admin only)
     */
    public function sendResponse(Request $request, $id)
    {
        $user = Auth::user();
        
        // Check if user is admin
        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        $validator = \Validator::make($request->all(), [
            'response' => 'required|string|min:1|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $message = SuspendedUserMessage::findOrFail($id);

        $message->update([
            'admin_response' => $request->input('response'),
            'responded_by' => $user->id,
            'responded_at' => now(),
        ]);

        Log::info('Admin response sent to suspended user', [
            'admin_id' => $user->id,
            'message_id' => $message->id,
            'user_id' => $message->user_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Response sent successfully.',
            'data' => [
                'id' => $message->id,
                'admin_response' => $message->admin_response,
                'responded_at' => $message->responded_at,
            ]
        ]);
    }
}

