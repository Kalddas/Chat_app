<?php

namespace App\Http\Controllers\Api\Users;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class PrivacySettingsController extends Controller
{
    /**
     * Get user's privacy settings
     */
    public function index()
    {
        /** @var User */
        $user = Auth::user();
        
        return response()->json([
            'status' => 'success',
            'settings' => [
                'read_receipts_enabled' => $user->read_receipts_enabled,
                'show_online_status' => $user->show_online_status,
            ]
        ]);
    }

    /**
     * Update privacy settings
     */
    public function update(Request $request)
    {
        /** @var User */
        $user = Auth::user();
        
        $validated = $request->validate([
            'read_receipts_enabled' => ['sometimes', 'boolean'],
            'show_online_status' => ['sometimes', 'boolean'],
        ]);

        $user->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Privacy settings updated successfully',
            'settings' => [
                'read_receipts_enabled' => $user->read_receipts_enabled,
                'show_online_status' => $user->show_online_status,
            ]
        ]);
    }

    /**
     * Toggle read receipts
     */
    public function toggleReadReceipts(Request $request)
    {
        /** @var User */
        $user = Auth::user();
        
        $user->read_receipts_enabled = !$user->read_receipts_enabled;
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Read receipts ' . ($user->read_receipts_enabled ? 'enabled' : 'disabled'),
            'read_receipts_enabled' => $user->read_receipts_enabled,
        ]);
    }

    /**
     * Toggle online status visibility
     */
    public function toggleOnlineStatus(Request $request)
    {
        /** @var User */
        $user = Auth::user();
        
        $user->show_online_status = !$user->show_online_status;
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Online status visibility ' . ($user->show_online_status ? 'enabled' : 'disabled'),
            'show_online_status' => $user->show_online_status,
        ]);
    }
}
