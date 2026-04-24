<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Models\Appeal;
use App\Models\User;

class AppealController extends Controller
{
    /**
     * Create an appeal for suspended users to contact admin
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|min:10|max:2000',
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
                'message' => 'You can only submit appeals if your account is suspended.'
            ], 403);
        }

        // Check if user already has a pending appeal
        $pendingAppeal = Appeal::where('user_id', $user->id)
            ->whereNull('handled_by')
            ->first();

        if ($pendingAppeal) {
            return response()->json([
                'success' => false,
                'message' => 'You already have a pending appeal. Please wait for admin response.',
                'appeal_id' => $pendingAppeal->id,
                'created_at' => $pendingAppeal->created_at
            ], 400);
        }

        // Create the appeal
        $appeal = Appeal::create([
            'user_id' => $user->id,
            'reason' => $request->input('reason'),
        ]);

        Log::info('Appeal created by suspended user', [
            'user_id' => $user->id,
            'appeal_id' => $appeal->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Your appeal has been submitted successfully. An admin will review it shortly.',
            'appeal' => [
                'id' => $appeal->id,
                'reason' => $appeal->reason,
                'created_at' => $appeal->created_at,
            ]
        ], 201);
    }

    /**
     * Get user's appeal status
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        $appeals = Appeal::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'appeals' => $appeals->map(function ($appeal) {
                return [
                    'id' => $appeal->id,
                    'reason' => $appeal->reason,
                    'status' => $appeal->handled_by ? 'handled' : 'pending',
                    'handled_at' => $appeal->handled_by ? $appeal->updated_at : null,
                    'created_at' => $appeal->created_at,
                ];
            })
        ]);
    }
}













