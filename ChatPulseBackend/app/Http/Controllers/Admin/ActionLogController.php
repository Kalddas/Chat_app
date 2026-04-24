<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AdminActionLog;

class ActionLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AdminActionLog::with(['admin', 'targetUser']);

        // Filter by action type
        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        // Filter by target user
        if ($request->has('target_user_id')) {
            $query->where('target_user_id', $request->target_user_id);
        }

        // Filter by admin
        if ($request->has('admin_user_id')) {
            $query->where('admin_user_id', $request->admin_user_id);
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'action_logs' => $logs->map(function($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'description' => $log->description,
                    'details' => $log->details,
                    'admin' => $log->admin ? [
                        'id' => $log->admin->id,
                        'email' => $log->admin->email,
                    ] : null,
                    'target_user' => $log->targetUser ? [
                        'id' => $log->targetUser->id,
                        'email' => $log->targetUser->email,
                    ] : null,
                    'created_at' => $log->created_at->format('Y-m-d H:i:s'),
                ];
            }),
            'pagination' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ]
        ]);
    }

    public function show($id)
    {
        $log = AdminActionLog::with(['admin', 'targetUser'])->findOrFail($id);

        return response()->json([
            'action_log' => [
                'id' => $log->id,
                'action' => $log->action,
                'description' => $log->description,
                'details' => $log->details,
                'admin' => $log->admin ? [
                    'id' => $log->admin->id,
                    'email' => $log->admin->email,
                ] : null,
                'target_user' => $log->targetUser ? [
                    'id' => $log->targetUser->id,
                    'email' => $log->targetUser->email,
                ] : null,
                'created_at' => $log->created_at->format('Y-m-d H:i:s'),
            ]
        ]);
    }
}
