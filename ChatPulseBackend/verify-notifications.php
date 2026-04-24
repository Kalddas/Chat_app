<?php
/**
 * Quick script to verify notifications are working
 * Run: php verify-notifications.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Notification Verification ===\n\n";

// Check user 1 (kal dass)
$user = App\Models\User::find(1);

if (!$user) {
    echo "❌ User ID 1 not found\n";
    exit(1);
}

echo "✅ User found: {$user->email}\n";
echo "   Profile: " . ($user->profile ? $user->profile->first_name . ' ' . $user->profile->last_name : 'No profile') . "\n\n";

// Check notifications
$notifications = $user->notifications()->get();
$unreadCount = $user->unreadNotifications()->count();

echo "📬 Total notifications: " . $notifications->count() . "\n";
echo "🔔 Unread notifications: {$unreadCount}\n\n";

if ($notifications->isEmpty()) {
    echo "❌ No notifications found\n";
    exit(0);
}

// Display each notification
echo "=== Notification Details ===\n\n";
foreach ($notifications as $index => $notification) {
    echo "Notification #" . ($index + 1) . ":\n";
    echo "  ID: {$notification->id}\n";
    echo "  Type: {$notification->type}\n";
    echo "  Created: {$notification->created_at}\n";
    echo "  Read: " . ($notification->read_at ? 'Yes' : 'No') . "\n";
    
    if (isset($notification->data['type']) && $notification->data['type'] === 'account_reported_warning') {
        echo "  ⚠️  WARNING NOTIFICATION\n";
        echo "  Report ID: {$notification->data['report_id']}\n";
        echo "  Message: {$notification->data['message']}\n";
        if (!empty($notification->data['admin_message'])) {
            echo "  Admin Message: \"{$notification->data['admin_message']}\"\n";
        }
    }
    echo "\n";
}

// Test API endpoint
echo "=== Testing API Endpoint ===\n\n";
echo "To test the API, run:\n";
echo "1. Login to get token:\n";
echo "   curl -X POST http://127.0.0.1:8000/api/login \\\n";
echo "     -H \"Content-Type: application/json\" \\\n";
echo "     -d '{\"email\":\"{$user->email}\",\"password\":\"YOUR_PASSWORD\"}'\n\n";
echo "2. Fetch notifications:\n";
echo "   curl -X GET http://127.0.0.1:8000/api/notifications \\\n";
echo "     -H \"Authorization: Bearer YOUR_TOKEN\"\n\n";

echo "✅ Verification complete!\n";
echo "\nSummary:\n";
echo "- User has {$notifications->count()} notification(s)\n";
echo "- {$unreadCount} unread\n";
echo "- Notifications ARE in database\n";
echo "- User should be able to fetch them via API\n";
