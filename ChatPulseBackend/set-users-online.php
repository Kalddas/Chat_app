<?php

/**
 * Script to manually set users online for testing
 * This simulates what the heartbeat endpoint does
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

echo "=== Setting Users Online ===\n\n";

// Get user IDs from command line or use all users
$userIds = array_slice($argv, 1);

if (empty($userIds)) {
    echo "Usage: php set-users-online.php [user_id1] [user_id2] ...\n";
    echo "Or run without arguments to set ALL users online\n\n";
    
    $users = User::all();
} else {
    $users = User::whereIn('id', $userIds)->get();
}

if ($users->isEmpty()) {
    echo "No users found!\n";
    exit(1);
}

echo "Setting " . $users->count() . " user(s) online...\n\n";

foreach ($users as $user) {
    $user->last_seen_at = now();
    $user->show_online_status = true;
    $user->save();
    
    echo "✅ User {$user->id} ({$user->email}): {$user->getOnlineStatusText()}\n";
}

echo "\n=== Complete ===\n";
echo "All users are now online!\n";
echo "\nTo verify, run: php diagnose-online-issue.php\n";
