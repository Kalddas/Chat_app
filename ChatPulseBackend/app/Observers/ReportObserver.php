<?php

namespace App\Observers;

use App\Events\ChatEvent;
use App\Models\AdminActionLog;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Report;
use App\Models\User;
use App\Models\UserProfile;
use App\Notifications\AccountReportedWarningNotification;

class ReportObserver
{
    public function created(Report $report): void
    {
        // Only apply to reports against a specific user
        if (!$report->reported_user_id) {
            return;
        }

        $reportedUserId = (int) $report->reported_user_id;

        $profile = UserProfile::where('user_id', $reportedUserId)->first();
        $resetAt = $profile?->reports_reset_at;

        $reportsQuery = Report::where('reported_user_id', $reportedUserId);
        if ($resetAt) {
            $reportsQuery->where('created_at', '>=', $resetAt);
        }

        $totalReportCount = (clone $reportsQuery)->count();
        $distinctReporterCount = (clone $reportsQuery)
            ->distinct('reporter_user_id')
            ->count('reporter_user_id');

        \Log::info('ReportObserver enforcement check', [
            'report_id' => $report->id,
            'reported_user_id' => $reportedUserId,
            'reports_reset_at' => $resetAt?->toDateTimeString(),
            'total_report_count' => $totalReportCount,
            'distinct_reporter_count' => $distinctReporterCount,
        ]);

        // 1) Warning at exactly 3 total reports (send once per reset window)
        // NOTE: 3 reports should NOT suspend the user.
        if ($totalReportCount === 3) {
            $alreadyWarnedQuery = AdminActionLog::where('target_user_id', $reportedUserId)
                ->where('action', 'user_auto_warned');
            if ($resetAt) {
                $alreadyWarnedQuery->where('created_at', '>=', $resetAt);
            }
            $alreadyWarned = $alreadyWarnedQuery->exists();

            if (!$alreadyWarned) {
                $reportedUser = User::find($reportedUserId);
                if ($reportedUser) {
                    try {
                        $reportedUser->notify(new AccountReportedWarningNotification($report));
                    } catch (\Throwable $e) {
                        \Log::error('ReportObserver failed to send warning notification', [
                            'error' => $e->getMessage(),
                            'reported_user_id' => $reportedUserId,
                            'report_id' => $report->id,
                        ]);
                    }

                    // Also send a LiveFlow chat message so user sees it in chat (like admin-resolved warnings)
                    try {
                        $warningText = 'Your account has been reported. Please ensure your activity complies with our community guidelines.';

                        // Ensure a system user exists to represent LiveFlow in chat
                        $systemEmail = 'liveflow@system.local';
                        $systemUser = User::where('email', $systemEmail)->first();
                        if (!$systemUser) {
                            $systemUser = User::create([
                                'email' => $systemEmail,
                                'password' => bcrypt(bin2hex(random_bytes(16))),
                                'role' => 'admin',
                                'email_verified_at' => now(),
                            ]);
                        }
                        if (!$systemUser->profile) {
                            $systemUser->profile()->create([
                                'first_name' => 'LiveFlow',
                                'last_name' => '',
                                'user_name' => 'LiveFlow',
                                'bio' => 'System messages',
                                'status' => 'Active',
                                'phone' => null,
                            ]);
                        }

                        // Find or create a 1:1 conversation between LiveFlow and the reported user
                        $conversation = Conversation::whereHas('users', function ($q) use ($systemUser) {
                                $q->where('user_id', $systemUser->id);
                            })
                            ->whereHas('users', function ($q) use ($reportedUser) {
                                $q->where('user_id', $reportedUser->id);
                            })
                            ->first();

                        if (!$conversation) {
                            $conversation = Conversation::create();
                            $conversation->users()->attach([$systemUser->id, $reportedUser->id]);
                        }

                        $msg = Message::create([
                            'sender_id' => $systemUser->id,
                            'receiver_id' => $reportedUser->id,
                            'conversation_id' => $conversation->id,
                            'text' => $warningText,
                        ]);

                        try {
                            event(new ChatEvent($msg));
                        } catch (\Throwable $e) {
                            \Log::warning('Broadcast LiveFlow warning failed (non-fatal): ' . $e->getMessage());
                        }
                    } catch (\Throwable $chatWarnError) {
                        \Log::error('ReportObserver failed to send LiveFlow chat warning', [
                            'error' => $chatWarnError->getMessage(),
                            'reported_user_id' => $reportedUserId,
                            'report_id' => $report->id,
                        ]);
                    }

                    try {
                        AdminActionLog::create([
                            'admin_user_id'   => null,
                            'target_user_id'  => $reportedUserId,
                            'action'          => 'user_auto_warned',
                            'details'         => [
                                'reason' => 'User reported 3 times',
                                'report_id' => $report->id,
                                'total_report_count' => $totalReportCount,
                                'distinct_reporter_count' => $distinctReporterCount,
                            ],
                            'description'     => "User automatically warned after receiving {$totalReportCount} reports.",
                        ]);
                    } catch (\Throwable $e) {
                        \Log::error('ReportObserver failed to create auto-warning action log', [
                            'error' => $e->getMessage(),
                            'reported_user_id' => $reportedUserId,
                        ]);
                    }
                }
            }
        }

        // 2) Ban permanently when user receives 4 or more total reports (per reset window)
        if ($totalReportCount >= 4) {
            if (!$profile || $profile->status === 'Banned') {
                return;
            }

            $oldStatus = $profile->status;
            $profile->status = 'Banned';
            $profile->suspended_until = null; // Banned is permanent, no expiry
            $profile->save();

            try {
                AdminActionLog::create([
                    'admin_user_id'   => null,
                    'target_user_id'  => $reportedUserId,
                    'action'          => 'user_auto_banned',
                    'details'         => [
                        'from' => $oldStatus,
                        'to' => 'Banned',
                        'reason' => 'User reported 4 or more times',
                        'report_id' => $report->id,
                        'total_report_count' => $totalReportCount,
                        'distinct_reporter_count' => $distinctReporterCount,
                    ],
                    'description'     => "User automatically banned after receiving {$totalReportCount} reports.",
                ]);
            } catch (\Throwable $e) {
                \Log::error('ReportObserver failed to create auto-ban action log', [
                    'error' => $e->getMessage(),
                    'reported_user_id' => $reportedUserId,
                ]);
            }

            // Send LiveFlow chat message to notify user they are banned
            try {
                $banText = 'Your account has been permanently banned due to multiple reports. If you believe this is a mistake, please contact support.';

                $systemEmail = 'liveflow@system.local';
                $systemUser = User::where('email', $systemEmail)->first();
                if (!$systemUser) {
                    $systemUser = User::create([
                        'email' => $systemEmail,
                        'password' => bcrypt(bin2hex(random_bytes(16))),
                        'role' => 'admin',
                        'email_verified_at' => now(),
                    ]);
                }
                if (!$systemUser->profile) {
                    $systemUser->profile()->create([
                        'first_name' => 'LiveFlow',
                        'last_name' => '',
                        'user_name' => 'LiveFlow',
                        'bio' => 'System messages',
                        'status' => 'Active',
                        'phone' => null,
                    ]);
                }

                $reportedUser = User::find($reportedUserId);
                if ($reportedUser) {
                    $conversation = Conversation::whereHas('users', function ($q) use ($systemUser) {
                            $q->where('user_id', $systemUser->id);
                        })
                        ->whereHas('users', function ($q) use ($reportedUser) {
                            $q->where('user_id', $reportedUser->id);
                        })
                        ->first();

                    if (!$conversation) {
                        $conversation = Conversation::create();
                        $conversation->users()->attach([$systemUser->id, $reportedUser->id]);
                    }

                    $msg = Message::create([
                        'sender_id' => $systemUser->id,
                        'receiver_id' => $reportedUser->id,
                        'conversation_id' => $conversation->id,
                        'text' => $banText,
                    ]);

                    try {
                        event(new ChatEvent($msg));
                    } catch (\Throwable $e) {
                        \Log::warning('Broadcast LiveFlow ban message failed (non-fatal): ' . $e->getMessage());
                    }
                }
            } catch (\Throwable $chatBanError) {
                \Log::error('ReportObserver failed to send LiveFlow chat ban message', [
                    'error' => $chatBanError->getMessage(),
                    'reported_user_id' => $reportedUserId,
                    'report_id' => $report->id,
                ]);
            }
        }
    }
}

