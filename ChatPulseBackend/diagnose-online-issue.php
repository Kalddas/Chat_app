<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\DB;

echo "=== Diagnosing Online Status Issue ===\n\n";

// Check all users
echo "1. Checking all users' online status settings:\n";
$users = User::with('profile')->get();

foreach ($users as $user) {
    $minutesAgo = $user->last_seen_at ? $user->last_seen_at->diffInMinutes(now()) : 'N/A';
    echo "   User {$user->id} ({$user->email}):\n";
    echo "     - show_online_status: " . ($user->show_online_status ? 'true' : 'false') . "\n";
    echo "     - last_seen_at: " . ($user->last_seen_at ? $user->last_seen_at->toDateTimeString() : 'NULL') . "\n";
    echo "     - Minutes ago: {$minutesAgo}\n";
    echo "     - isOnline(): " . ($user->isOnline() ? 'true' : 'false') . "\n";
    echo "     - Status text: " . $user->getOnlineStatusText() . "\n";
    echo "\n";
}

echo "\n2. Checking middleware registration:\n";
try {
    $middleware = app()->make('router')->getMiddleware();
    if (isset($middleware['update.last.seen'])) {
        echo "   ✅ UpdateLastSeen middleware is registered\n";
    } else {
        echo "   ❌ UpdateLastSeen middleware is NOT registered\n";
    }
} catch (\Exception $e) {
    echo "   ⚠️  Could not check: " . $e->getMessage() . "\n";
}

echo "\n3. Checking recent messages:\n";
$recentMessages = DB::table('messages')
    ->orderBy('created_at', 'desc')
    ->limit(5)
    ->get();

if ($recentMessages->count() > 0) {
    foreach ($recentMessages as $msg) {
        echo "   Message ID {$msg->id}: sender={$msg->sender_id}, receiver={$msg->receiver_id}, created={$msg->created_at}\n";
    }
} else {
    echo "   No messages found\n";
}

echo "\n4. Checking conversations:\n";
$conversations = DB::table('conversations')
    ->join('conversation_users', 'conversations.id', '=', 'conversation_users.conversation_id')
    ->select('conversations.id', 'conversation_users.user_id')
    ->get()
    ->groupBy('id');

foreach ($conversations as $convId => $users) {
    $userIds = $users->pluck('user_id')->toArray();
    echo "   Conversation {$convId}: Users " . implode(', ', $userIds) . "\n";
}

echo "\n5. Checking active tokens:\n";
$tokens = DB::table('personal_access_tokens')
    ->select('tokenable_id', DB::raw('count(*) as count'), DB::raw('MAX(last_used_at) as last_used'))
    ->groupBy('tokenable_id')
    ->get();

foreach ($tokens as $token) {
    $user = User::find($token->tokenable_id);
    echo "   User {$token->tokenable_id} ({$user->email}): {$token->count} token(s), last used: {$token->last_used}\n";
}

echo "\n=== Diagnosis Complete ===\n";
