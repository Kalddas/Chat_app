<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

echo "=== SIMULATING /api/chat/conversations/{id}/messages ===\n\n";

// Get conversation 9 (where the recent video was sent)
$conversationId = 9;

$messages = DB::table('messages')
    ->where('conversation_id', $conversationId)
    ->orderBy('created_at', 'desc')
    ->limit(3)
    ->get();

foreach ($messages as $msg) {
    echo "Message ID: {$msg->id}\n";
    echo "Text: {$msg->text}\n";
    echo "Created: {$msg->created_at}\n";
    
    // Get attachments
    $attachments = DB::table('attachments')
        ->where('message_id', $msg->id)
        ->get();
    
    if ($attachments->count() > 0) {
        echo "Attachments:\n";
        foreach ($attachments as $att) {
            $url = "http://127.0.0.1:8000/storage/{$att->file_path}";
            echo "  - Type: {$att->file_type}\n";
            echo "  - URL: {$url}\n";
            echo "  - Size: " . round($att->file_size / 1024 / 1024, 2) . " MB\n";
        }
    }
    echo "\n";
}
