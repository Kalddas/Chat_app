<?php
/**
 * Quick verification for "reset report count after unsuspension".
 *
 * Steps:
 * - pick a user with a profile
 * - set reports_reset_at = now()
 * - create 1 report against them
 * - show that counts AFTER reset are based on created_at >= reports_reset_at
 *
 * Run:
 *   php test-report-reset.php
 */
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Report;
use App\Models\User;
use App\Models\UserProfile;

echo "=== Report Reset Test ===\n\n";

$target = User::with('profile')->whereHas('profile')->first();
if (!$target) {
    echo "❌ No user with profile found.\n";
    exit(1);
}
$reporter = User::where('id', '!=', $target->id)->first();
if (!$reporter) {
    echo "❌ No reporter user found.\n";
    exit(1);
}

$profile = UserProfile::where('user_id', $target->id)->first();
$profile->reports_reset_at = now();
$profile->save();

echo "Target: {$target->email} (ID {$target->id})\n";
echo "Reset at: {$profile->reports_reset_at->toDateTimeString()}\n\n";

Report::create([
    'title' => 'Reset test report',
    'message' => 'Auto-generated report after reset',
    'image' => null,
    'reporter_user_id' => $reporter->id,
    'reported_user_id' => $target->id,
    'type' => 'user_report',
    'reason' => 'Reset test',
    'status' => 'pending',
]);

$totalAllTime = Report::where('reported_user_id', $target->id)->count();
$totalAfterReset = Report::where('reported_user_id', $target->id)
    ->where('created_at', '>=', $profile->reports_reset_at)
    ->count();

echo "All-time reports: {$totalAllTime}\n";
echo "Reports after reset: {$totalAfterReset} (should be 1 or more if multiple created after reset)\n";

echo "\n=== Done ===\n";

