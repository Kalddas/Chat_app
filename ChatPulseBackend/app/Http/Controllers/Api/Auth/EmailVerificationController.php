<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use App\Mail\OtpMail;
use App\Services\OtpService;
use Illuminate\Support\Facades\Auth;

class EmailVerificationController extends Controller
{
    public function sendOtp(Request $request,OtpService $otpService)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Invalid or non-existent email',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email already verified',
                'verified' => true
            ], 200);
        }

        $otpService->sendOtp($user);


        return response()->json([
            'message' => 'OTP sent to your email',
            'expires_in' => 10 * 60
        ], 200);
    }

    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'otp' => 'required|digits:6'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Invalid input',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email already verified',
                'verified' => true
            ], 200);
        }

        if (!$user->email_verification_otp || $user->otp_expires_at < now()) {
            return response()->json([
                'message' => 'OTP expired or invalid'
            ], 403);
        }

        if ($user->email_verification_otp != $request->otp) {
            return response()->json([
                'message' => 'Incorrect OTP'
            ], 403);
        }


        $user->markEmailAsVerified();
        $user->email_verification_otp = null;
        $user->otp_expires_at = null;
        $user->save();

        event(new Verified($user));
        Auth::login($user);
        $token = $user->createToken('auth-token')->plainTextToken;

        // Load profile so frontend has first_name, last_name, etc. (same shape as login)
        $user->load('profile');

        return response()->json([
            'message' => 'Email verified successfully',
            'verified' => true,
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ], 200);
    }

    public function status(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        return response()->json([
            'verified' => $user->hasVerifiedEmail(),
            'message' => $user->hasVerifiedEmail() ? 'Email verified' : 'Email not verified'
        ], 200);
    }
}
