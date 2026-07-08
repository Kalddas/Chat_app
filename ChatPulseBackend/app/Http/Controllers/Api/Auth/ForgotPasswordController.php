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
            $email = strtolower(trim($request->input('email', '')));

            // Validate email input (avoid DNS check — it fails offline and blocks valid Gmail addresses)
            $validator = Validator::make(['email' => $email], [
                'email' => ['required', 'email:rfc']
            ], [
                'email.required' => 'Email address is required',
                'email.email' => 'Please provide a valid email address'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Find the user (case-insensitive)
            $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'No account found with this email address. Please check the spelling or sign up first.'
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
                        'email' => $user->email,
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
                    ? 'Could not send email (mail server unavailable). Use the temporary password shown below to log in.'
                    : 'Could not send email. Use the temporary password shown below to log in.';

                $isLocal = app()->environment('local', 'development');

                return response()->json([
                    'success' => $isLocal,
                    'message' => $userMessage,
                    'error' => $isLocal ? $errorMessage : 'Email sending failed',
                    'error_type' => $isLocal ? $errorClass : null,
                    'data' => [
                        'email' => $user->email,
                        'temporary_password' => $isLocal ? $temporaryPassword : null,
                        'password_generated' => true,
                        'email_sent' => false,
                        'info' => $isLocal
                            ? 'Use this temporary password to log in, then change your password.'
                            : 'Password was reset but email could not be sent. Please contact support.',
                    ]
                ], $isLocal ? 200 : 500);
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
        $lower = 'abcdefghijklmnopqrstuvwxyz';
        $upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $digits = '0123456789';
        $special = '@$!%*?&#';
        $all = $lower . $upper . $digits . $special;

        // Guarantee password meets login/change requirements
        $password = $lower[random_int(0, strlen($lower) - 1)]
            . $upper[random_int(0, strlen($upper) - 1)]
            . $digits[random_int(0, strlen($digits) - 1)]
            . $special[random_int(0, strlen($special) - 1)];

        for ($i = 4; $i < $length; $i++) {
            $password .= $all[random_int(0, strlen($all) - 1)];
        }

        return str_shuffle($password);
    }
}
