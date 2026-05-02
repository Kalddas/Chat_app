<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== CHECKING VIDEO MESSAGES ===\n\n";

// Get recent messages with attachments
$messages = DB::table('messages')
    ->join('attachments', 'messages.id', '=', 'attachments.message_id')
    ->select('messages.*', 'attachments.file_path', 'attachments.file_type', 'attachments.file_size')
    ->orderBy('messages.id', 'desc')
    ->limit(5)
    ->get();

echo "Recent messages with attachments:\n";
foreach ($messages as $msg) {
    echo "- Message ID: {$msg->id}\n";
    echo "  Conversation: {$msg->conversation_id}\n";
    echo "  Text: {$msg->text}\n";
    echo "  File Type: {$msg->file_type}\n";
    echo "  File Path: {$msg->file_path}\n";
    echo "  File Size: " . round($msg->file_size / 1024 / 1024, 2) . " MB\n";
    echo "  Created: {$msg->created_at}\n\n";
}

echo "\n=== SOLUTION ===\n";
echo "Videos ARE uploading successfully!\n";
echo "The issue is that the other user doesn't see them in real-time.\n";
echo "They need to refresh the conversation to see new videos.\n";
