<?php

namespace App\Http\Controllers\Api\Users;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OnlineStatusController extends Controller
{
    /**
     * Heartbeat endpoint to update user's online status
     * Frontend should call this every 30-60 seconds
     */
    public function heartbeat(Request $request)
    {
        /** @var \App\Models\User */
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }
        
        // Update last_seen_at if user has online status enabled
        if ($user->show_online_status) {
            $user->last_seen_at = now();
            $user->save();
        }
        
        return response()->json([
            'status' => 'success',
            'is_online' => $user->isOnline(),
            'online_status' => $user->getOnlineStatusText(),
            'last_seen_at' => $user->show_online_status ? $user->last_seen_at?->toDateTimeString() : null,
        ]);
    }
    
    /**
     * Get online status of a specific user
     */
    public function getStatus(Request $request, $userId)
    {
        $user = \App\Models\User::find($userId);

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        return response()->json([
            'user_id' => $user->id,
            'is_online' => $user->isOnline(),
            'online_status' => $user->getOnlineStatusText(),
            'last_seen_at' => $user->show_online_status ? $user->last_seen_at?->toDateTimeString() : null,
        ]);
    }

    /**
     * Mark user as offline immediately (e.g. on logout).
     */
    public function markOffline(Request $request)
    {
        /** @var \App\Models\User */
        $user = Auth::user();

        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        if ($user->show_online_status) {
            $user->last_seen_at = now()->subMinutes(10);
            $user->save();
        }

        return response()->json([
            'status' => 'success',
            'is_online' => false,
            'online_status' => 'Offline',
        ]);
    }
}
