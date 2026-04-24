<?php

use App\Http\Controllers\ChatController;
use App\Http\Controllers\Api\Auth\EmailVerificationController;
use App\Http\Controllers\Api\Auth\ForgotPasswordController;
use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Auth\RegisterController;
use App\Http\Controllers\Api\Auth\ResetPasswordController;
use App\Http\Controllers\Api\Auth\ChangePasswordController;
use App\Http\Controllers\Api\Auth\DeleteAccountController;
use App\Http\Controllers\Api\Matches\MatchController;
use App\Http\Controllers\Admin\DashboaredController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Api\ReportController as ApiReportController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\Admin\ActionLogController;
use App\Http\Controllers\Api\Notification\NotificationController;
use App\Http\Controllers\Api\Users\UserProfile;
use App\Http\Controllers\Api\SuspendedUserMessageController;
use App\Models\User;
use App\Models\Admin;
use App\Models\UserProfile as UserProfileModel;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Test endpoint for debugging
Route::get('/test-reports', function (Request $request) {
    return response()->json([
        'message' => 'Reports API is accessible',
        'user' => $request->user(),
        'timestamp' => now()
    ]);
})->middleware('auth:sanctum');

Route::get('/sanctum/csrf-cookie', [Laravel\Sanctum\Http\Controllers\CsrfCookieController::class, 'show']);

Route::post('/register', [RegisterController::class, 'store']);
Route::post('/login', [LoginController::class, 'login']);

// Local-only utility to bootstrap admin if missing
if (app()->environment('local')) {
    Route::post('/bootstrap/admin', function () {
        $email = 'admin@randomchat.com';
        $user = User::where('email', $email)->first();
        if (!$user) {
            $user = User::create([
                'email' => $email,
                'password' => Hash::make('Admin@123'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]);

            UserProfileModel::create([
                'first_name' => 'Admin',
                'last_name' => 'User',
                'user_name' => 'SuperAdmin',
                'bio' => 'Super admin user',
                'status' => 'Active',
                'phone' => '+251912131415',
                'user_id' => $user->id,
            ]);

            Admin::create([
                'user_id' => $user->id,
                'permission_level' => 'super_admin',
            ]);
        } else {
            // Ensure role and admin row are correct
            if ($user->role !== 'admin') {
                $user->role = 'admin';
                $user->email_verified_at = $user->email_verified_at ?? now();
                $user->save();
            }
            if (!Admin::where('user_id', $user->id)->exists()) {
                Admin::create([
                    'user_id' => $user->id,
                    'permission_level' => 'super_admin',
                ]);
            }
        }

        return response()->json(['status' => 'ok']);
    });

    // Force-reset admin credentials if needed (local only)
    Route::post('/bootstrap/admin-reset', function () {
        $email = 'admin@randomchat.com';
        $user = User::where('email', $email)->first();
        if (!$user) {
            return response()->json(['error' => 'admin_not_found'], 404);
        }
        $user->password = Hash::make('Admin@123');
        $user->role = 'admin';
        $user->email_verified_at = $user->email_verified_at ?? now();
        $user->save();

        if (!Admin::where('user_id', $user->id)->exists()) {
            Admin::create([
                'user_id' => $user->id,
                'permission_level' => 'super_admin',
            ]);
        }
        return response()->json(['status' => 'reset_ok']);
    });
}

// Email verification routes
// Route::get('/email/verify/{id}/{hash}',[EmailVerificationController::class,'verify'])->middleware(['signed'])->name('verification.verify');
// Route::get('/email/verify', [EmailVerificationController::class, 'notice'])->name('verification.notice');
// Route::post('/email/verification-notification', [EmailVerificationController::class, 'send'])->middleware(['throttle:6,1'])->name('verification.send');
Route::post('/email/verification/otp', [EmailVerificationController::class, 'sendOtp']);
Route::post('/email/verification/verify', [EmailVerificationController::class, 'verifyOtp']);



// Password reset routes
Route::post('/password/forgot', [ForgotPasswordController::class, 'sendResetLinkEmail'])->name('api.password.email');
Route::post('password/reset', [ResetPasswordController::class, 'reset'])->name('api.password.update');


// Get all tags route
Route::get('/tags', [MatchController::class, 'getAllTags']);

//protected routes

Route::middleware(['auth:sanctum', \App\Http\Middleware\CheckUserStatus::class, 'update.last.seen'])->group(function () {
    Route::post('/logout', [LoginController::class, 'logout']);
    Route::post('/change-password', [ChangePasswordController::class, 'changePassword']);
    Route::post('/delete-account', [DeleteAccountController::class, 'deleteAccount']);
    // Find Match routes
    Route::get('/find/matches', [MatchController::class, 'findMatches']);
    Route::get('/matches', [MatchController::class, 'getMatches']);
    Route::post('/update/tags', [MatchController::class, 'updateTags']);
    Route::get('/user/tag', [MatchController::class, 'getUserByTag']);

    // email verification status
    Route::get('/email/verification/status', [EmailVerificationController::class, 'status']);

    // Reports (user-submitted)
    Route::post('/reports', [ApiReportController::class, 'store']);
    Route::post('/reports/export-chats', [ApiReportController::class, 'exportChats']);
});


//Admin routes

Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/dashboard', [DashboaredController::class, 'index']);

    //use management
    Route::get('/users', [UserManagementController::class, 'index']);
    Route::get('/users/all',[UserManagementController::class,'getAllUsers']);
    Route::patch('/users/{id}/status', [UserManagementController::class, 'updateStatus']);
    Route::delete('/users/{id}', [UserManagementController::class, 'destroy']);


    // Reports routes
    Route::get('/reports', [ReportController::class, 'index']);
    Route::get('/reports/{id}', [ReportController::class, 'show']);
    Route::patch('/reports/{id}/status', [ReportController::class, 'updateStatus']);

    // Action logs routes
    Route::get('/action-logs', [ActionLogController::class, 'index']);
    Route::get('/action-logs/{id}', [ActionLogController::class, 'show']);
    
    // Suspended user messages routes (admin only)
    Route::prefix('suspended-messages')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\SuspendedUserMessageController::class, 'index']);
        Route::post('/{id}/mark-read', [\App\Http\Controllers\Admin\SuspendedUserMessageController::class, 'markAsRead']);
        Route::post('/{id}/respond', [\App\Http\Controllers\Admin\SuspendedUserMessageController::class, 'sendResponse']);
        Route::post('/mark-all-read', [\App\Http\Controllers\Admin\SuspendedUserMessageController::class, 'markAllAsRead']);
        Route::get('/unread-count', [\App\Http\Controllers\Admin\SuspendedUserMessageController::class, 'unreadCount']);
    });
});


// user-profile routes
Route::prefix('user')->middleware(['auth:sanctum', 'update.last.seen'])->group(function () {
    Route::get('/profile', [UserProfile::class, 'index']);
    Route::post('/mood', [UserProfile::class, 'updateMood']);
    Route::post('/language', [UserProfile::class, 'updateLanguage']);
    Route::get('/available/tags', [UserProfile::class, 'getAvailableTags']);
    Route::patch('/profile/update', [UserProfile::class, 'update']);
    Route::delete('/profile/tags',[UserProfile::class,'deleteTags']);
    
    // Privacy settings routes
    Route::prefix('privacy')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\Users\PrivacySettingsController::class, 'index']);
        Route::patch('/', [\App\Http\Controllers\Api\Users\PrivacySettingsController::class, 'update']);
        Route::post('/toggle-read-receipts', [\App\Http\Controllers\Api\Users\PrivacySettingsController::class, 'toggleReadReceipts']);
        Route::post('/toggle-online-status', [\App\Http\Controllers\Api\Users\PrivacySettingsController::class, 'toggleOnlineStatus']);
    });
    
    // Online status routes
    Route::post('/heartbeat', [\App\Http\Controllers\Api\Users\OnlineStatusController::class, 'heartbeat']);
    Route::get('/status/{userId}', [\App\Http\Controllers\Api\Users\OnlineStatusController::class, 'getStatus']);
});


// Chat routes


// Chat routes
Route::prefix('chat')->middleware(['auth:sanctum', 'update.last.seen'])->group(function () {
    Route::get('/conversations/{conversationId}/messages', [ChatController::class, 'fetchMessages']);
    Route::post('/conversations/{conversationId}/messages/send', [ChatController::class, 'sendMessage']);
    Route::delete('/conversations/{conversationId}', [ChatController::class, 'deleteConversation']);
    Route::get('/users/{userId}/conversations', [ChatController::class, 'listUserConversations']);
    Route::put('/messages/{messageId}/edit', [ChatController::class, 'editMessage']);
    Route::delete('/messages/{messageId}/delete', [ChatController::class, 'deleteMessage']);
    Route::get('/chat-list', [ChatController::class, 'chatlist']);
    Route::post('/conversations/{conversationId}/read', [ChatController::class, 'markAsRead']);

    // ✅ FIXED versions (no duplicate /chat prefix)
    Route::post('/requests', [ChatController::class, 'sendChatRequest']);
    Route::get('/requests/received', [ChatController::class, 'listReceivedRequests']);
    Route::post('/requests/{requestId}/accept', [ChatController::class, 'acceptRequest']);
    Route::post('/requests/{requestId}/reject', [ChatController::class, 'rejectRequest']);

    // Block / unblock users
    Route::post('/block', [ChatController::class, 'blockUser']);
    Route::post('/unblock', [ChatController::class, 'unblockUser']);
    
    // Reaction routes
    Route::post('/messages/{messageId}/reactions', [\App\Http\Controllers\Api\Chat\ReactionController::class, 'store']);
});

// Suspended user messages routes (suspended users can send messages)
Route::prefix('suspended-messages')->middleware('auth:sanctum')->group(function(){
    Route::post('/', [SuspendedUserMessageController::class, 'store']);
    Route::get('/', [SuspendedUserMessageController::class, 'index']);
});

// Appeals routes
Route::prefix('appeals')->middleware('auth:sanctum')->group(function(){
    Route::post('/', [\App\Http\Controllers\Api\AppealController::class, 'store']);
    Route::get('/', [\App\Http\Controllers\Api\AppealController::class, 'index']);
});

// Notification routs

Route::prefix('notifications')->middleware('auth:sanctum')->group(function(){
    Route::get('/',[NotificationController::class,'index']);
    Route::put('/{notificationId}/read',[NotificationController::class,'markAsRead']);
    Route::put('/read-all',[NotificationController::class,'markAllAsRead']);
    Route::get('/unread-count',[NotificationController::class,'unreadCount']);
});


// get all chat requests

Route::get('/chat-requests',[ChatController::class,'getAllChatRequests']);


// Route::controller(ChatController::class)->group(function() {
//     Route::get('/v1/messages/index/{conversation_id}', 'index');
//     Route::post('/v1/messages/store', 'store');
//     Route::patch('/v1/messages/edit/{message_id}', 'edit');
//     Route::delete('/v1/messages/destroy/{message_id}', 'destroy');
// });
