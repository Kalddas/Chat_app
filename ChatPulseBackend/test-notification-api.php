<?php
/**
 * Test notification API endpoint
 * Run: php test-notification-api.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

echo "=== Testing Notification API ===\n\n";

// Get user
$user = App\Models\User::find(1);
if (!$user) {
    echo "❌ User not found\n";
    exit(1);
}

echo "✅ User: {$user->email}\n";

// Create a test token
$token = $user->createToken('test-token')->plainTextToken;
echo "✅ Token created: {$token}\n\n";

// Simulate API request
echo "Simulating GET /api/notifications...\n\n";

try {
    // Get notifications directly
    $notifications = $user->notifications()->latest()->take(20)->get();
    $unreadCount = $user->unreadNotifications()->count();
    
    // Format response like the API does
    $response = [
        'notifications' => $notifications->map(function ($notification) {
            $notificationType = $notification->type;
            $simpleType = 'unknown';
            
            if (strpos($notificationType, 'AccountReportedWarningNotification') !== false) {
                $simpleType = 'account_reported_warning';
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
    ];
    
    echo "✅ API Response:\n";
    echo json_encode($response, JSON_PRETTY_PRINT) . "\n\n";
    
    // Check for warning notifications
    $warningCount = 0;
    foreach ($response['notifications'] as $notif) {
        if ($notif['type'] === 'account_reported_warning') {
            $warningCount++;
            echo "⚠️  Warning Notification Found:\n";
            echo "   Message: {$notif['data']['message']}\n";
            echo "   Admin Message: {$notif['data']['admin_message']}\n";
            echo "   Created: {$notif['created_at']}\n\n";
        }
    }
    
    if ($warningCount === 0) {
        echo "❌ No warning notifications found!\n";
    } else {
        echo "✅ Found {$warningCount} warning notification(s)\n";
    }
    
    echo "\n=== Test cURL Command ===\n";
    echo "curl -X GET http://127.0.0.1:8000/api/notifications \\\n";
    echo "  -H \"Authorization: Bearer {$token}\" \\\n";
    echo "  -H \"Content-Type: application/json\"\n\n";
    
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
