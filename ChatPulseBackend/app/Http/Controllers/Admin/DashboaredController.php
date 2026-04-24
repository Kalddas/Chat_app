<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Carbon\Carbon;
use App\Models\Report;
use App\Models\AdminActionLog;

class DashboaredController extends Controller
{
    public function index(){
        $totalUsers = User::count();
        $newUsers = User::where('created_at', '>=', Carbon::now()->subMonth())->count();
        $userGrowthPercentage = $totalUsers > 0 ? ($newUsers / $totalUsers) * 100 : 0;
        $activeUsers = User::where('last_login_at','>=',Carbon::now()->subDay())->count();
        $onlineUsers = 342; // this would be tracked from the real time tracking

        $pendingReports = Report::where('status','pending')->count();
        $recentReports = Report::orderBy('created_at','desc')->take(10)->get();
        
        // Get recently logged in users (sorted by last login, most recent first)
        $recentlyLoggedInUsers = User::with('profile')
            ->whereNotNull('last_login_at')
            ->orderBy('last_login_at', 'desc')
            ->take(10)
            ->get();

        // Get recent action logs
        $recentActionLogs = AdminActionLog::with(['admin', 'targetUser'])
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        return response()->json([
            'total_users' => $totalUsers,
            'user_growth_percentage' => round($userGrowthPercentage, 2),
            'active_users' => $activeUsers,
            'online_users' => $onlineUsers,
            'pending_reports' => $pendingReports,
            'recent_users' => $recentlyLoggedInUsers->map(function($user) {
                $profile = $user->profile;
                return [
                    'id' => $user->id,
                    'first_name' => $profile ? $profile->first_name : 'N/A',
                    'last_name' => $profile ? $profile->last_name : 'N/A',
                    'user_name' => $profile ? $profile->user_name : 'N/A',
                    'email' => $user->email,
                    'profile_picture_url' => $user->profile_picture_url,
                    'last_login_at' => $user->last_login_at ? $user->last_login_at->format('Y-m-d H:i:s') : null,
                    'last_login_human' => $user->last_login_at ? $user->last_login_at->diffForHumans() : 'Never',
                    'status' => $profile ? $profile->status : 'Pending',
                    'role' => $user->role
                ];
            }),
            'recent_reports' => $recentReports->map(function($r){
                return [
                    'id' => $r->id,
                    'title' => $r->title,
                    'message' => $r->message,
                    'status' => $r->status,
                    'file_url' => $r->image ? asset('storage/'.$r->image) : null,
                    'created_at' => $r->created_at->format('Y-m-d H:i:s')
                ];
            }),
            'recent_action_logs' => $recentActionLogs->map(function($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'description' => $log->description,
                    'admin' => $log->admin ? $log->admin->email : 'System',
                    'target_user' => $log->targetUser ? $log->targetUser->email : null,
                    'created_at' => $log->created_at->format('Y-m-d H:i:s'),
                    'time_ago' => $log->created_at->diffForHumans(),
                ];
            })
        ]);


    }
}
