<?php

namespace App\Providers;

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\ServiceProvider;

class BroadcastServiceProvider extends ServiceProvider
{
    public function boot()
    {
        // Register the /broadcasting/auth route
        Broadcast::routes(['middleware' => ['auth:sanctum']]); // or 'auth' if using session

        // Register your channels
        require base_path('routes/channels.php');
    }
}
