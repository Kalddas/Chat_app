<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Api\Auth\ForgotPasswordController;
use App\Http\Controllers\Api\Auth\ResetPasswordController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

// Home route
Route::get('/', function () {
    return view('welcome');
});

// Dashboard route (protected)
Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// Profile routes (protected)
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Forgot password page (GET)
Route::get('/forgot-password', function () {
    return view('auth.forgot-password');
})->name('password.request');

// Handle sending reset password link (POST)
Route::post('/password/forgot', [ForgotPasswordController::class, 'sendResetLinkEmail'])->name('web.password.email');

// Reset password page (GET)
Route::get('/reset-password/{token}', function ($token, Request $request) {
    return view('auth.reset-password', [
        'token' => $token,
        'email' => $request->email // Pre-fill email if available in query
    ]);
})->name('password.reset');

// Handle resetting password (POST)
Route::put('/password/reset', [ResetPasswordController::class, 'reset'])->name('web.password.update');

// Include other auth routes
require __DIR__.'/auth.php';
Route::get('/env-test', function () {
    return env('APP_NAME', 'Env not loaded');
});

