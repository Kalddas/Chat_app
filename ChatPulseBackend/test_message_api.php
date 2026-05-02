<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== TESTING MESSAGE API RESPONSE ===\n\n";

// Get the most recent message with attachment
$message = DB::table('messages')
    ->join('attachments', 'messages.id', '=', 'attachments.message_id')
    ->select('messages.*', 'attachments.id as attachment_id', 'attachments.file_path', 'attachments.file_type')
    ->orderBy('messages.id', 'desc')
    ->first();

if ($message) {
    echo "Message ID: {$message->id}\n";
    echo "File Path: {$message->file_path}\n";
    echo "File Type: {$message->file_type}\n\n";
    
    // Test what asset() returns
    $url = asset('storage/' . $message->file_path);
    echo "Generated URL: {$url}\n\n";
    
    // Check if file exists
    $fullPath = storage_path('app/public/' . $message->file_path);
    echo "Full Path: {$fullPath}\n";
    echo "File Exists: " . (file_exists($fullPath) ? 'YES' : 'NO') . "\n";
    
    if (file_exists($fullPath)) {
        echo "File Size: " . round(filesize($fullPath) / 1024 / 1024, 2) . " MB\n";
    }
} else {
    echo "No messages with attachments found\n";
}
