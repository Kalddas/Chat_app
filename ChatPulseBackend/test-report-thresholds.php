<?php
/**
 * Test script for automated report enforcement:
 * - warning after 3 total reports
 * - 10-day suspension after 5 distinct reporters
 *
 * Run:
 *   php test-report-thresholds.php
 */
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Report;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Support\Facades\DB;

echo "=== Report Thresholds Test ===\n\n";

$target = User::with('profile')->whereHas('profile')->first();
if (!$target) {
    echo "❌ No user with a profile found. Create users first.\n";
    exit(1);
}

$reporters = User::where('id', '!=', $target->id)->limit(6)->get();
if ($reporters->count() < 5) {
    echo "❌ Need at least 5 other users to act as distinct reporters.\n";
    exit(1);
}

echo "Target user: {$target->email} (ID {$target->id})\n";
echo "Initial profile status: " . ($target->profile?->status ?? 'N/A') . "\n";
echo "Initial suspended_until: " . ($target->profile?->suspended_until?->toDateTimeString() ?? 'null') . "\n\n";

// Create 5 reports (5 distinct reporters)
echo "Creating 5 reports (5 distinct reporters)...\n";
foreach ($reporters->take(5) as $idx => $r) {
    $n = $idx + 1;
    Report::create([
        'title' => "Threshold test report {$n}",
        'message' => "Auto-generated report {$n}",
        'image' => null,
        'reporter_user_id' => $r->id,
        'reported_user_id' => $target->id,
        'type' => 'user_report',
        'reason' => 'Threshold test',
        'status' => 'pending',
    ]);
    echo "  ✅ Created report {$n} from reporter {$r->email}\n";
}

echo "\nCounts after creation:\n";
$total = Report::where('reported_user_id', $target->id)->count();
$distinct = Report::where('reported_user_id', $target->id)->distinct('reporter_user_id')->count('reporter_user_id');
echo "  - total reports: {$total}\n";
echo "  - distinct reporters: {$distinct}\n\n";

$profile = UserProfile::where('user_id', $target->id)->first();
echo "Profile status now: " . ($profile?->status ?? 'N/A') . "\n";
echo "Suspended until: " . ($profile?->suspended_until?->toDateTimeString() ?? 'null') . "\n\n";

echo "Notification count for target (latest 5):\n";
$latest = $target->notifications()->latest()->take(5)->get();
foreach ($latest as $notif) {
    $type = $notif->type;
    $msg = is_array($notif->data) ? ($notif->data['message'] ?? '') : '';
    echo "  - {$notif->created_at}: {$type} {$msg}\n";
}

echo "\n=== Done ===\n";

