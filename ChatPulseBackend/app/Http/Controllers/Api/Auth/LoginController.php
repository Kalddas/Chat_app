<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\User;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        try {
            $credentials = $request->validate([
                'email' => ['required', 'email:rfc,dns'],
                'password' => ['required']
            ], [
                'email.email' => 'Please provide a valid email address'
            ]);

            $user = User::with('profile')->where('email', $credentials['email'])->first();

            if (!$user) {
                return response()->json(["message" => __('auth.failed')], 401);
            }

            $passwordMatches = false;
            $isTemporaryPassword = false;

            // ✅ Check normal password
            if (Hash::check($credentials['password'], $user->password)) {
                $passwordMatches = true;
            }

            // ✅ Check temporary password
            if ($user->temporary_password && Hash::check($credentials['password'], $user->temporary_password)) {
                $passwordMatches = true;
                $isTemporaryPassword = true;
            }

            if (!$passwordMatches) {
                return response()->json(["message" => __('auth.failed')], 401);
            }

            // ✅ Authenticate user first
            Auth::login($user);
            
            // Update last login timestamp
            $user->last_login_at = now();
            $user->save();
            
            // Check user status
            $status = optional($user->profile)->status;
            
            // ❌ Prevent banned users from logging in
            if ($status === 'Banned') {
                return response()->json([
                    'success' => false,
                    'message' => 'Your account has been banned and cannot be accessed.'
                ], 403);
            }
            
            // ✅ Normal login → continue
            if (!$user->hasVerifiedEmail()) {
                return response()->json([
                    'message' => 'Email not verified'
                ], 403);
            }

            $token = $user->createToken('auth-token')->plainTextToken;
            
            // ✅ Check if user is suspended - allow login but flag for suspended page
            if ($status === 'Suspended') {
                // Reload user with profile
                $user->load('profile');
                return response()->json([
                    'success' => true,
                    'message' => 'Your account has been suspended. Please send a message for help.',
                    'user' => $user,
                    'token' => $token,
                    'token_type' => 'Bearer',
                    'account_suspended' => true,
                    'status' => 'Suspended',
                    'requires_password_change' => false,
                    'needs_password_change' => false,
                ]);
            }
            
            // ✅ If temporary password used → notify client to change password
            if ($isTemporaryPassword && $user->needs_password_change) {
                // Reload user with profile
                $user->load('profile');
                return response()->json([
                    'success' => true,
                    'message' => 'Temporary password login detected. Please change your password.',
                    'user' => $user,
                    'token' => $token,
                    'token_type' => 'Bearer',
                    'requires_password_change' => true,
                    'needs_password_change' => true,
                ]);
            }

            // Reload user with profile for normal login
            $user->load('profile');
            
            return response()->json([
                'success' => true,
                'message' => 'Login successful.',
                'user' => $user,
                'token' => $token,
                'token_type' => 'Bearer',
                'needs_password_change' => $user->needs_password_change,
                'requires_password_change' => false,
                'account_suspended' => false,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => "Validation error",
                'error' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('Login database error: ' . $e->getMessage());
            // Check if it's a table doesn't exist error
            if (str_contains($e->getMessage(), "doesn't exist") || str_contains($e->getMessage(), 'Base table or view not found')) {
                return response()->json([
                    'message' => 'Database tables not found. Please run: php artisan migrate',
                    'error' => 'Database migration required'
                ], 500);
            }
            return response()->json([
                'message' => "Database error occurred",
                'error' => $e->getMessage()
            ], 500);
        } catch (\Exception $e) {
            \Log::error('Login error: ' . $e->getMessage());
            return response()->json([
                'message' => "Internal server error",
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            $user = $request->user();
            if ($user && $user->currentAccessToken()) {
                $user->currentAccessToken()->delete();
            }

            return response()->json([
                'message' => 'Logged out successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Logout error: ' . $e->getMessage());
            // Even if token deletion fails, return success to allow frontend to clear local state
            return response()->json([
                'message' => 'Logged out successfully'
            ]);
        }
    }
}
