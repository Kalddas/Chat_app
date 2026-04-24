<?php
namespace App\Services;

use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use App\Mail\OtpMail;

class OtpService{
    public function sendOtp(User $user){
        $otp = rand(100000, 999999);
        $user->email_verification_otp = $otp;
        $user->otp_expires_at = Carbon::now()->addMinutes(10);
        $user->save();

        try {
            Mail::to($user->email)->send(new OtpMail($otp));
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send OTP. Please try again.'
            ], 500);
        }
    }
}
