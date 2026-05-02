<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class ChangePasswordController extends Controller
{
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'old_password' => 'required',
            'new_password' => [
                'required',
                'min:8',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/'
            ],
            'password_confirmation' => 'required|same:new_password',
        ], [
            'new_password.regex' => 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#)'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        // Check if user has temporary password
        $passwordValid = false;
        
        // Check if old password matches the regular password
        if (Hash::check($request->old_password, $user->password)) {
            $passwordValid = true;
        }
        
        // Also accept temporary password
        if ($user->temporary_password && Hash::check($request->old_password, $user->temporary_password)) {
            $passwordValid = true;
        }

        if (!$passwordValid) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect'
            ], 400);
        }

        // Additional check: make sure new password is confirmed
        if ($request->new_password !== $request->password_confirmation) {
            return response()->json([
                'success' => false,
                'message' => 'Password confirmation does not match'
            ], 400);
        }

        // Update password
        $user->password = Hash::make($request->new_password);
        
        // Clear temporary password and reset the flag
        $user->temporary_password = null;
        $user->needs_password_change = false;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully'
        ]);
    }
}
