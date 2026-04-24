<?php

namespace App\Http\Controllers\Api\Notification;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        try {
            /** @var User */
            $user = Auth::user();
            $limit = $request->input('limit', 20);
            
            $notifications = $user->notifications()
                ->latest()
                ->take($limit)
                ->get();

            $unreadCount = $user->unreadNotifications()->count();

            return response()->json([
                'notifications' => $notifications->map(function ($notification) {
                    // Extract simple type from Laravel notification class name
                    $notificationType = $notification->type;
                    $simpleType = 'unknown';
                    
                    // Laravel stores full class name like "App\Notifications\NewMessageNotification"
                    if (strpos($notificationType, 'NewMessageNotification') !== false) {
                        $simpleType = 'new_message';
                    } elseif (strpos($notificationType, 'ChatRequestNotification') !== false) {
                        $simpleType = 'chat_request';
                    } elseif (strpos($notificationType, 'MessageDeletedNotification') !== false) {
                        $simpleType = 'message_deleted';
                    } elseif (strpos($notificationType, 'AccountReportedWarningNotification') !== false) {
                        $simpleType = 'account_reported_warning';
                    } elseif (isset($notification->data['type'])) {
                        $simpleType = $notification->data['type'];
                    }
                    
                    return [
                        'id' => $notification->id,
                        'type' => $simpleType,
                        'data' => $notification->data,
                        'read_at' => $notification->read_at,
                        'created_at' => $notification->created_at->toDateTimeString(),
                    ];
                }),
                'unread_count' => $unreadCount,
            ]);
        } catch (\Exception $e) {
            \Log::error('Notifications index error: ' . $e->getMessage());
            return response()->json([
                'notifications' => [],
                'unread_count' => 0,
                'error' => 'Failed to load notifications. Please ensure database migrations are run.'
            ], 500);
        }
    }

    public function markAsRead(Request $request, $notificationId)
    {
        /** @var User */
        $user = Auth::user();
        $notification = $user->notifications()->findOrFail($notificationId);
        $notification->markAsRead();

        return response()->json(['message' => 'Notification marked as read']);
    }

    public function markAllAsRead()
    {
        /** @var User */
        $user = Auth::user();
        $user->unreadNotifications->markAsRead();

        return response()->json(['message' => 'All notifications marked as read']);
    }

    public function unreadCount(Request $request)
    {
        try {
            /** @var User */
            $user = Auth::user();

            return response()->json([
                'unread_count' => $user->unreadNotifications()->count(),
            ]);
        } catch (\Exception $e) {
            \Log::error('Unread count error: ' . $e->getMessage());
            return response()->json([
                'unread_count' => 0,
                'error' => 'Failed to load unread count. Please ensure database migrations are run.'
            ], 500);
        }
    }
}
