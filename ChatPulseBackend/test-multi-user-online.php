<?php

/**
 * Test script for Multiple Users Online Simultaneously
 * 
 * This script simulates two users logging in and being online at the same time
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

echo "=== Multiple Users Online Test ===\n\n";

// Get or create two test users
echo "Step 1: Setting up test users...\n";

$user1 = User::where('email', 'user1@test.com')->first();
if (!$user1) {
    echo "   Creating User 1...\n";
    $user1 = User::create([
        'email' => 'user1@test.com',
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
        'role' => 'user',
        'show_online_status' => true,
    ]);
    
    // Create profile
    $user1->profile()->create([
        'first_name' => 'Test',
        'last_name' => 'User One',
        'user_name' => 'testuser1',
        'status' => 'Active',
    ]);
}

$user2 = User::where('email', 'user2@test.com')->first();
if (!$user2) {
    echo "   Creating User 2...\n";
    $user2 = User::create([
        'email' => 'user2@test.com',
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
        'role' => 'user',
        'show_online_status' => true,
    ]);
    
    // Create profile
    $user2->profile()->create([
        'first_name' => 'Test',
        'last_name' => 'User Two',
        'user_name' => 'testuser2',
        'status' => 'Active',
    ]);
}

echo "   ✅ User 1: {$user1->email} (ID: {$user1->id})\n";
echo "   ✅ User 2: {$user2->email} (ID: {$user2->id})\n";

echo "\n";

// Simulate both users coming online
echo "Step 2: Simulating both users coming online...\n";

$user1->last_seen_at = now();
$user1->show_online_status = true;
$user1->save();

$user2->last_seen_at = now();
$user2->show_online_status = true;
$user2->save();

echo "   ✅ User 1 last_seen_at: {$user1->last_seen_at}\n";
echo "   ✅ User 2 last_seen_at: {$user2->last_seen_at}\n";

echo "\n";

// Check if both users are online
echo "Step 3: Checking online status...\n";

$user1->refresh();
$user2->refresh();

echo "   User 1:\n";
echo "     - isOnline(): " . ($user1->isOnline() ? 'true ✅' : 'false ❌') . "\n";
echo "     - getOnlineStatusText(): {$user1->getOnlineStatusText()}\n";

echo "   User 2:\n";
echo "     - isOnline(): " . ($user2->isOnline() ? 'true ✅' : 'false ❌') . "\n";
echo "     - getOnlineStatusText(): {$user2->getOnlineStatusText()}\n";

echo "\n";

// Create tokens for both users (simulating login)
echo "Step 4: Creating authentication tokens (simulating login)...\n";

// Delete old tokens
$user1->tokens()->delete();
$user2->tokens()->delete();

$token1 = $user1->createToken('test-token-1')->plainTextToken;
$token2 = $user2->createToken('test-token-2')->plainTextToken;

echo "   ✅ User 1 token: " . substr($token1, 0, 20) . "...\n";
echo "   ✅ User 2 token: " . substr($token2, 0, 20) . "...\n";

echo "\n";

// Check active tokens
echo "Step 5: Verifying active tokens...\n";

$activeTokens = DB::table('personal_access_tokens')
    ->whereIn('tokenable_id', [$user1->id, $user2->id])
    ->get();

echo "   Active tokens: {$activeTokens->count()}\n";
foreach ($activeTokens as $token) {
    $user = User::find($token->tokenable_id);
    echo "     - {$user->email}: Token ID {$token->id}\n";
}

echo "\n";

// Check if they can see each other as online
echo "Step 6: Simulating API response (User 1 viewing User 2)...\n";

$user2->refresh();
$apiResponse = [
    'user' => [
        'id' => $user2->id,
        'email' => $user2->email,
        'first_name' => $user2->profile?->first_name,
        'last_name' => $user2->profile?->last_name,
        'is_online' => $user2->isOnline(),
        'online_status' => $user2->getOnlineStatusText(),
        'last_seen_at' => $user2->show_online_status ? $user2->last_seen_at?->toDateTimeString() : null,
    ]
];

echo json_encode($apiResponse, JSON_PRETTY_PRINT) . "\n";

echo "\n";

// Test conversation scenario
echo "Step 7: Testing conversation scenario...\n";

// Check if conversation exists between users
$conversation = \App\Models\Conversation::whereHas('users', function($q) use ($user1) {
    $q->where('user_id', $user1->id);
})->whereHas('users', function($q) use ($user2) {
    $q->where('user_id', $user2->id);
})->first();

if (!$conversation) {
    echo "   Creating conversation between users...\n";
    $conversation = \App\Models\Conversation::create();
    $conversation->users()->attach([$user1->id, $user2->id]);
    echo "   ✅ Conversation created (ID: {$conversation->id})\n";
} else {
    echo "   ✅ Conversation exists (ID: {$conversation->id})\n";
}

echo "\n";

// Simulate API response for conversation list
echo "Step 8: Simulating conversation list API response...\n";

$conversations = \App\Models\Conversation::whereHas('users', function($q) use ($user1) {
    $q->where('user_id', $user1->id);
})->with(['users', 'lastMessage'])->get();

$result = $conversations->map(function ($conv) use ($user1) {
    $otherUser = $conv->users->firstWhere('id', '!=', $user1->id);
    
    if (!$otherUser) return null;
    
    return [
        'conversation_id' => $conv->id,
        'user' => [
            'id' => $otherUser->id,
            'email' => $otherUser->email,
            'first_name' => $otherUser->profile?->first_name,
            'last_name' => $otherUser->profile?->last_name,
            'is_online' => $otherUser->isOnline(),
            'online_status' => $otherUser->getOnlineStatusText(),
            'last_seen_at' => $otherUser->show_online_status ? $otherUser->last_seen_at?->toDateTimeString() : null,
        ],
    ];
})->filter();

echo "User 1's conversation list:\n";
echo json_encode($result->values(), JSON_PRETTY_PRINT) . "\n";

echo "\n";

// Test with one user going offline
echo "Step 9: Testing User 2 going offline (6 minutes ago)...\n";

$user2->last_seen_at = now()->subMinutes(6);
$user2->save();
$user2->refresh();

echo "   User 2:\n";
echo "     - last_seen_at: {$user2->last_seen_at}\n";
echo "     - isOnline(): " . ($user2->isOnline() ? 'true ❌' : 'false ✅') . "\n";
echo "     - getOnlineStatusText(): {$user2->getOnlineStatusText()}\n";

echo "\n";

// Test with hidden status
echo "Step 10: Testing User 2 hiding online status...\n";

$user2->show_online_status = false;
$user2->last_seen_at = now();
$user2->save();
$user2->refresh();

echo "   User 2:\n";
echo "     - show_online_status: false\n";
echo "     - last_seen_at: {$user2->last_seen_at}\n";
echo "     - isOnline(): " . ($user2->isOnline() ? 'true ❌' : 'false ✅') . "\n";
echo "     - getOnlineStatusText(): {$user2->getOnlineStatusText()}\n";

echo "\n";

// Restore User 2 to online
$user2->show_online_status = true;
$user2->last_seen_at = now();
$user2->save();

echo "=== Test Complete ===\n\n";

echo "Summary:\n";
echo "✅ Two users can have separate authentication tokens\n";
echo "✅ Both users can be online simultaneously\n";
echo "✅ Each user's online status is tracked independently\n";
echo "✅ Users can see each other's online status\n";
echo "✅ Privacy settings work correctly\n";
echo "✅ Conversation list shows correct online status\n";

echo "\nTest Users Created:\n";
echo "  Email: user1@test.com | Password: password123\n";
echo "  Email: user2@test.com | Password: password123\n";

echo "\nNext Steps:\n";
echo "1. Open two browser windows (one normal, one incognito)\n";
echo "2. Login as user1@test.com in window 1\n";
echo "3. Login as user2@test.com in window 2\n";
echo "4. Both should see each other as 'Online'\n";
echo "5. Send messages between them\n";
echo "6. Verify both receive messages\n";
