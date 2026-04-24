<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use App\Models\User;
use App\Mail\TempPasswordMail;

class ForgotPasswordController extends Controller
{
    /**
     * Handle sending a temporary password to the user's email.
     */
    public function sendResetLinkEmail(Request $request)
    {
        try {
            // Validate email input
            $validator = Validator::make($request->all(), [
                // Don't use `exists:users,email` here; it produces the confusing message
                // "The selected email is invalid." We handle "email not found" explicitly below.
                'email' => ['required', 'email']
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            // Find the user
            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email not found'
                ], 404);
            }

            // Generate a secure temporary password
            $temporaryPassword = $this->generateTemporaryPassword();

            // Save the hashed temporary password and mark for change
            $user->temporary_password = Hash::make($temporaryPassword);
            $user->needs_password_change = true;
            $user->save();

            // Attempt to send the temporary password via email
            try {
                // Test if the mail view exists and can be rendered
                try {
                    $mailable = new TempPasswordMail($temporaryPassword, $user->email);
                    Mail::to($user->email)->send($mailable);
                } catch (\Throwable $mailException) {
                    // Log specific mail exception details
                    \Illuminate\Support\Facades\Log::error('Mail sending exception', [
                        'email' => $request->email,
                        'user_id' => $user->id,
                        'exception_class' => get_class($mailException),
                        'exception_message' => $mailException->getMessage(),
                        'exception_file' => $mailException->getFile(),
                        'exception_line' => $mailException->getLine(),
                        'trace' => $mailException->getTraceAsString()
                    ]);
                    throw $mailException; // Re-throw to be caught by outer catch
                }

                \Illuminate\Support\Facades\Log::info('Temporary password email sent successfully', [
                    'user_id' => $user->id,
                    'email' => $user->email
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Temporary password has been sent to your email address.',
                    'data' => [
                        'email' => $request->email,
                        'info' => 'Please check your inbox and use the temporary password to login. You will be required to change it after login.'
                    ]
                ], 200);
            } catch (\Throwable $e) {
                $errorMessage = $e->getMessage();
                $errorClass = get_class($e);
                
                // Log the error with full details
                \Illuminate\Support\Facades\Log::error('Failed to send temporary password email', [
                    'email' => $request->email,
                    'user_id' => $user->id,
                    'error' => $errorMessage,
                    'error_type' => $errorClass,
                    'error_file' => $e->getFile(),
                    'error_line' => $e->getLine(),
                    'mail_config' => [
                        'mailer' => config('mail.default'),
                        'host' => config('mail.mailers.smtp.host'),
                        'port' => config('mail.mailers.smtp.port'),
                        'encryption' => config('mail.mailers.smtp.encryption'),
                        'username_set' => !empty(config('mail.mailers.smtp.username')),
                    ]
                ]);

                // Log the temporary password for recovery
                \Illuminate\Support\Facades\Log::info('Temporary password generated (email failed)', [
                    'email' => $request->email,
                    'user_id' => $user->id,
                    'temporary_password' => $temporaryPassword,
                    'note' => 'Password was generated and saved. Check this log entry for the password.',
                    'password_saved' => true,
                    'error' => $errorMessage
                ]);

                // Check if it's a connection/network error
                $errorMessageLower = strtolower($errorMessage);
                $isConnectionError = strpos($errorMessageLower, 'connection') !== false ||
                                    strpos($errorMessageLower, 'unable to connect') !== false ||
                                    strpos($errorMessageLower, 'failed to respond') !== false ||
                                    strpos($errorMessageLower, 'stream_socket_client') !== false ||
                                    strpos($errorMessageLower, 'could not connect') !== false;

                $userMessage = $isConnectionError 
                    ? 'Cannot connect to email server. Please check your network connection and email configuration. The temporary password has been generated and logged for recovery.'
                    : 'Failed to send temporary password email. The temporary password has been generated and logged for recovery.';

                return response()->json([
                    'success' => false,
                    'message' => $userMessage,
                    'error' => app()->environment('local', 'development') ? $errorMessage : 'Email sending failed',
                    'error_type' => app()->environment('local', 'development') ? $errorClass : null,
                    'data' => [
                        'email' => $request->email,
                        'password_generated' => true,
                        'password_logged' => true,
                        'log_file' => 'storage/logs/laravel.log',
                        'info' => 'Check storage/logs/laravel.log for your temporary password'
                    ]
                ], 500);
            }
        } catch (\Throwable $outerException) {
            // Catch any exceptions that occur outside the mail try-catch
            \Illuminate\Support\Facades\Log::error('Unexpected error in forgot password', [
                'email' => $request->email ?? 'unknown',
                'error' => $outerException->getMessage(),
                'error_type' => get_class($outerException),
                'error_file' => $outerException->getFile(),
                'error_line' => $outerException->getLine(),
                'trace' => $outerException->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'An unexpected error occurred. Please try again later.',
                'error' => app()->environment('local', 'development') ? $outerException->getMessage() : null,
                'error_type' => app()->environment('local', 'development') ? get_class($outerException) : null,
            ], 500);
        }
    }

    /**
     * Generate a secure random temporary password.
     */
    private function generateTemporaryPassword($length = 12)
    {
        $characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $password = '';
        $max = strlen($characters) - 1;

        for ($i = 0; $i < $length; $i++) {
            $password .= $characters[random_int(0, $max)];
        }

        return $password;
    }
}
