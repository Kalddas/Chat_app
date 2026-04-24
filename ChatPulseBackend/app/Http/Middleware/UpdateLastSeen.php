<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class UpdateLastSeen
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();
            
            // Only update if user wants to show online status
            if ($user->show_online_status) {
                // Update last_seen_at every 2 minutes to avoid too many DB writes
                $lastUpdate = $user->last_seen_at;
                if (!$lastUpdate || $lastUpdate->diffInMinutes(now()) >= 2) {
                    $user->last_seen_at = now();
                    $user->save();
                }
            }
        }

        return $next($request);
    }
}
