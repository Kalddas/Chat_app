<?php

/**
 * Test script for Online/Offline Status Feature
 * 
 * This script tests the online status functionality including:
 * - UpdateLastSeen middleware
 * - User online status detection
 * - Privacy settings (show_online_status toggle)
 * - Online status in conversation lists
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\DB;

echo "=== Online/Offline Status Feature Test ===\n\n";

// Test 1: Check if privacy columns exist
echo "Test 1: Checking database schema...\n";
try {
    $columns = DB::select("SHOW COLUMNS FROM users WHERE Field IN ('show_online_status', 'last_seen_at')");
    if (count($columns) === 2) {
        echo "✅ Privacy columns exist in users table\n";
        foreach ($columns as $col) {
            echo "   - {$col->Field}: {$col->Type} (Default: {$col->Default})\n";
        }
    } else {
        echo "❌ Missing privacy columns. Run migration: php artisan migrate\n";
    }
} catch (\Exception $e) {
    echo "❌ Error checking schema: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 2: Check users with online status enabled
echo "Test 2: Users with online status enabled...\n";
$usersWithOnlineStatus = User::where('show_online_status', true)->count();
$totalUsers = User::count();
echo "   Users with online status enabled: {$usersWithOnlineStatus} / {$totalUsers}\n";

echo "\n";

// Test 3: Test isOnline() method
echo "Test 3: Testing isOnline() method...\n";
$testUser = User::first();
if ($testUser) {
    echo "   Testing with user: {$testUser->email} (ID: {$testUser->id})\n";
    echo "   - show_online_status: " . ($testUser->show_online_status ? 'true' : 'false') . "\n";
    echo "   - last_seen_at: " . ($testUser->last_seen_at ? $testUser->last_seen_at->toDateTimeString() : 'null') . "\n";
    echo "   - isOnline(): " . ($testUser->isOnline() ? 'true' : 'false') . "\n";
    echo "   - getOnlineStatusText(): " . $testUser->getOnlineStatusText() . "\n";
    
    // Simulate user being online
    echo "\n   Simulating user coming online...\n";
    $testUser->last_seen_at = now();
    $testUser->show_online_status = true;
    $testUser->save();
    
    $testUser->refresh();
    echo "   - isOnline() after update: " . ($testUser->isOnline() ? 'true ✅' : 'false ❌') . "\n";
    echo "   - getOnlineStatusText(): " . $testUser->getOnlineStatusText() . "\n";
    
    // Test with hidden status
    echo "\n   Testing with hidden online status...\n";
    $testUser->show_online_status = false;
    $testUser->save();
    
    $testUser->refresh();
    echo "   - isOnline() with hidden status: " . ($testUser->isOnline() ? 'true ❌' : 'false ✅') . "\n";
    echo "   - getOnlineStatusText(): " . $testUser->getOnlineStatusText() . "\n";
    
    // Restore original state
    $testUser->show_online_status = true;
    $testUser->save();
} else {
    echo "❌ No users found in database\n";
}

echo "\n";

// Test 4: Find currently online users
echo "Test 4: Finding currently online users...\n";
$onlineUsers = User::where('show_online_status', true)
    ->where('last_seen_at', '>=', now()->subMinutes(5))
    ->get();

echo "   Currently online users: {$onlineUsers->count()}\n";
foreach ($onlineUsers as $user) {
    $minutesAgo = $user->last_seen_at ? $user->last_seen_at->diffInMinutes(now()) : 'N/A';
    echo "   - {$user->email} (last seen {$minutesAgo} minutes ago)\n";
}

echo "\n";

// Test 5: Test offline users (last seen > 5 minutes ago)
echo "Test 5: Finding offline users (last seen > 5 minutes ago)...\n";
$offlineUsers = User::where('show_online_status', true)
    ->where('last_seen_at', '<', now()->subMinutes(5))
    ->whereNotNull('last_seen_at')
    ->limit(5)
    ->get();

echo "   Offline users (showing first 5): {$offlineUsers->count()}\n";
foreach ($offlineUsers as $user) {
    echo "   - {$user->email}: {$user->getOnlineStatusText()}\n";
}

echo "\n";

// Test 6: Test users with hidden status
echo "Test 6: Users with hidden online status...\n";
$hiddenStatusUsers = User::where('show_online_status', false)->limit(5)->get();
echo "   Users with hidden status: {$hiddenStatusUsers->count()}\n";
foreach ($hiddenStatusUsers as $user) {
    echo "   - {$user->email}: {$user->getOnlineStatusText()}\n";
}

echo "\n";

// Test 7: Middleware registration check
echo "Test 7: Checking middleware registration...\n";
try {
    $middleware = app()->make('router')->getMiddleware();
    if (isset($middleware['update.last.seen'])) {
        echo "✅ UpdateLastSeen middleware is registered as 'update.last.seen'\n";
        echo "   Class: " . $middleware['update.last.seen'] . "\n";
    } else {
        echo "❌ UpdateLastSeen middleware is NOT registered\n";
        echo "   Available middleware aliases: " . implode(', ', array_keys($middleware)) . "\n";
    }
} catch (\Exception $e) {
    echo "⚠️  Could not check middleware: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 8: API endpoint simulation
echo "Test 8: Simulating API response format...\n";
$sampleUser = User::with('profile')->first();
if ($sampleUser) {
    $apiResponse = [
        'user' => [
            'id' => $sampleUser->id,
            'first_name' => $sampleUser->profile?->first_name,
            'last_name' => $sampleUser->profile?->last_name,
            'user_name' => $sampleUser->profile?->user_name,
            'profile_picture_url' => $sampleUser->profile_picture_url,
            'is_online' => $sampleUser->isOnline(),
            'online_status' => $sampleUser->getOnlineStatusText(),
            'last_seen_at' => $sampleUser->show_online_status ? $sampleUser->last_seen_at?->toDateTimeString() : null,
        ]
    ];
    
    echo "   Sample API response:\n";
    echo json_encode($apiResponse, JSON_PRETTY_PRINT) . "\n";
}

echo "\n=== Test Complete ===\n";
echo "\nNext Steps:\n";
echo "1. Test the API endpoints:\n";
echo "   - GET /api/chat/users/{userId}/conversations (includes online status)\n";
echo "   - GET /api/chat/chat-list (includes online status)\n";
echo "2. Toggle online status visibility:\n";
echo "   - POST /api/user/privacy/toggle-online-status\n";
echo "3. Make API requests to trigger UpdateLastSeen middleware\n";
echo "4. Check that last_seen_at updates every 2 minutes\n";
