<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;


class CheckUserStatus
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();
        
        \Log::info('CheckUserStatus middleware', [
            'user_id' => $user?->id,
            'has_profile' => $user?->profile ? true : false,
            'profile_status' => $user?->profile?->status,
            'path' => $request->path()
        ]);

        if ($user){
            $profile = $user->profile;
            $status = optional($profile)->status;
            
            // Auto-unsuspend users whose temporary suspension period has expired
            if ($status === 'Suspended' && $profile && $profile->suspended_until) {
                if (Carbon::parse($profile->suspended_until)->isPast()) {
                    $profile->status = 'Active';
                    $profile->suspended_until = null;
                    // Reset report counters once suspension completes
                    $profile->reports_reset_at = now();
                    $profile->save();
                    $status = 'Active';
                    \Log::info('Auto-unsuspended user after suspension period elapsed', [
                        'user_id' => $user->id,
                    ]);
                }
            }
            
            // Allow suspended users to access appeals and suspended-messages routes
            $allowedPaths = ['api/appeals', 'api/suspended-messages'];
            $currentPath = $request->path();
            $isAllowedPath = false;
            foreach ($allowedPaths as $allowedPath) {
                if (str_starts_with($currentPath, $allowedPath)) {
                    $isAllowedPath = true;
                    break;
                }
            }
            
            if($status === 'Suspended' && !$isAllowedPath){
                \Log::warning('User suspended', ['user_id' => $user->id, 'path' => $currentPath]);
                return response()->json([
                    'message' => 'Your account has been suspended'
                ],403);
            }

            if($status === 'Banned'){
                \Log::warning('User banned', ['user_id' => $user->id]);
                return response()->json([
                    'message' => 'Your account has been banned'
                ],403);
            }
        }

        return $next($request);
    }
}
