<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\AdminActionLog;
use Illuminate\Support\Facades\Auth;

class UserManagementController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('profile');

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('profile', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('user_name', 'like', "%{$search}%");
            });
        }

        $users = $query->paginate(10);

        return response()->json([
            'users' => $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'first_name' => optional($user->profile)->first_name,
                    'email' => $user->email,
                    'status' => optional($user->profile)->status,
                    'message_count' => $user->message_count,
                    'last_login' => $user->last_login_at,
                    'join_date' => $user->created_at->format('Y-m-d'),
                ];
            }),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ]
        ]);
    }

    public function getAllUsers()
    {
        $users = User::with('profile')->paginate(10);
        if (!empty($users)) {
            return response()->json([
                'message' => 'users fetched successfully',
                'users' => $users->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'first_name' => optional($user->profile)->first_name,
                        'email' => $user->email,
                        'status' => optional($user->profile)->status,
                        'message_count' => $user->message_count,
                        'last_login' => $user->last_login_at,
                        'join_date' => $user->created_at->format('Y-m-d'),
                    ];
                }),

                'pagination' => [
                    'current_page' => $users->currentPage(),
                    'total_pages' => $users->lastPage(),
                    'total_items' => $users->total(),
                    'per_page' => $users->perPage(),
                ]
            ]);
        }
    }


    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => ['required', 'string'],
            'reason' => ['nullable','string','max:2000']
        ]);

        // Normalize status to match enum values (case-insensitive input allowed)
        $normalized = strtolower(trim($request->status));
        $map = [
            'active' => 'Active',
            'suspended' => 'Suspended',
            'banned' => 'Banned',
        ];
        if (!array_key_exists($normalized, $map)) {
            return response()->json([
                'message' => 'Invalid status value',
                'allowed' => array_values($map)
            ], 422);
        }
        $finalStatus = $map[$normalized];

        // Accept either User id or Profile id
        $user = User::with('profile')->find($id);
        if (!$user) {
            $profile = UserProfile::findOrFail($id);
            $user = $profile->user()->with('profile')->first();
        }

        $oldStatus = optional($user->profile)->status;
        $reason = $request->input('reason');

        if ($user->profile) {
            $user->profile()->update(['status' => $finalStatus]);
            $user->refresh();

            // Log the status change
            try {
                AdminActionLog::create([
                    'admin_user_id' => Auth::id(),
                    'target_user_id' => $user->id,
                    'action' => 'user_status_changed',
                    'details' => [
                        'from' => $oldStatus,
                        'to' => $finalStatus,
                        'user_email' => $user->email,
                        'reason' => $reason,
                    ],
                    'description' => $reason
                        ? "Changed user status from {$oldStatus} to {$finalStatus}. Reason: {$reason}"
                        : "Changed user status from {$oldStatus} to {$finalStatus}"
                ]);
            } catch (\Exception $e) {
                // Log error but don't fail the request
                \Log::error('Failed to create action log: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'user status updated successfully',
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'status' => optional($user->profile)->status,
            ]
        ]);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json([
            'message' => 'user deleted successfully',
        ]);
    }
}
