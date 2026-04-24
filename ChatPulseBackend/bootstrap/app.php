<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Session\Middleware\StartSession;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        //channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withBroadcasting(
        __DIR__ . '/../routes/channels.php',
        ['prefix' => 'api', 'middleware' => ['api', 'auth:sanctum']],
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => App\Http\Middleware\CheckRole::class,
            'cors' => App\Http\Middleware\CorsMiddleware::class,
            'update.last.seen' => App\Http\Middleware\UpdateLastSeen::class,
            // 'status' => App\Http\Middleware\CheckUserStatus::class
        ]);

        // Add CORS middleware to API routes
        $middleware->append(\App\Http\Middleware\CorsMiddleware::class);
        // $middleware->append(StartSession::class);
        // $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Ensure API routes always return JSON, even for unhandled exceptions
        $exceptions->shouldRenderJsonWhen(function ($request, \Throwable $e) {
            return $request->is('api/*') || $request->expectsJson();
        });
        
        // Handle exceptions for API routes
        $exceptions->render(function (\Throwable $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                \Illuminate\Support\Facades\Log::error('Unhandled API exception', [
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => app()->environment('local', 'development') 
                        ? $e->getMessage() 
                        : 'An error occurred. Please try again later.',
                    'error' => app()->environment('local', 'development') ? $e->getMessage() : null,
                    'error_type' => app()->environment('local', 'development') ? get_class($e) : null,
                ], 500);
            }
            
            return null; // Let Laravel handle other exceptions normally
        });
    })->create();
