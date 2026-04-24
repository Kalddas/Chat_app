<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Events\ChatEvent;
use App\Notifications\AccountReportedWarningNotification;
use Illuminate\Http\Request;
use App\Models\Report;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;


class ReportController extends Controller
{
    public function index(){
        try{
            \Log::info('Admin reports API called');
            $totalReports = Report::count();
        $pendingReports = Report::where('status','pending')->count();
        $resolvedReports = Report::where('status','resolved')->count();

        $reportsByStatus = [
            'pending' => $pendingReports,
            'resolved' => $resolvedReports,
            'in_review' => Report::where('status','in_review')->count()
        ];

        // Eager load relationships to reduce queries
        $recentReportsRaw = Report::with([
                'reportedUser.profile',
                'reporter.profile'
            ])
            ->orderBy('created_at', 'desc')
            ->take(50)
            ->get();

        // Group by reported user so a user who has been reported multiple times
        // appears only once in the dashboard, with extra metadata
        $groupedReports = $recentReportsRaw->groupBy(function ($report) {
            return $report->reported_user_id ?: ('report-' . $report->id);
        });
        $recentReports = $groupedReports->values();
            
        \Log::info('Reports found', [
            'total' => $totalReports,
            'pending' => $pendingReports,
            'recent_count' => $recentReports->count()
        ]);


        return response()->json([
            'total_reports' => $totalReports,
            'pending_reports' => $pendingReports,
            'resolved_reports' => $resolvedReports,
            'reports_by_status' => $reportsByStatus,
            'recent_reports' => $recentReports->map(function($group) {
                /** @var \Illuminate\Support\Collection $group */
                /** @var \App\Models\Report $report */
                $report = $group->first();
                $reportCount = $report->reported_user_id ? $group->count() : 1;
                $distinctReporters = $group
                    ->pluck('reporter')
                    ->filter()
                    ->unique('id')
                    ->values();

                $reportedName = trim(($report->reportedUser?->profile?->first_name ?? '') . ' ' . ($report->reportedUser?->profile?->last_name ?? ''));
                $reporterName = trim(($report->reporter?->profile?->first_name ?? '') . ' ' . ($report->reporter?->profile?->last_name ?? ''));
                $isAutoSuspended = $report->reportedUser?->profile
                    && $report->reportedUser->profile->status === 'Suspended';

                $reportersPayload = $distinctReporters->map(function ($user) {
                    if (!$user) {
                        return null;
                    }
                    $name = trim(($user->profile?->first_name ?? '') . ' ' . ($user->profile?->last_name ?? ''));
                    return [
                        'id' => $user->id,
                        'name' => $name !== '' ? $name : $user->email,
                        'email' => $user->email,
                    ];
                })->filter()->values();

                return [
                    'id' => $report->id,
                    'title' => $report->title,
                    'message' => $report->message,
                    'image_url' => $report->image ? asset('storage/' . $report->image) : null,
                    'reported_user' => $report->reportedUser ? [
                        'id' => $report->reportedUser->id,
                        'name' => $reportedName !== '' ? $reportedName : $report->reportedUser->email,
                        'email' => $report->reportedUser->email,
                        'profile' => $report->reportedUser->profile,
                    ] : null,
                    'reporter' => $report->reporter ? [
                        'id' => $report->reporter->id,
                        'name' => $reporterName !== '' ? $reporterName : $report->reporter->email,
                        'email' => $report->reporter->email,
                        'profile' => $report->reporter->profile
                    ] : null,
                    'status' => $report->status,
                    'report_count' => $reportCount,
                    'auto_suspended' => $isAutoSuspended,
                    'reporters' => $reportersPayload,
                    'created_at' => $report->created_at->format('Y-m-d H:i'),
                ];
            })
        ],200);
        }

        catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'An error occurred while fetching reports.',
                'errors' => [$e->getMessage()],
                'code' => 500,
            ], 500);
        }



    }

    public function updateStatus(Request $request, $id)
    {
        try {
            \Log::info('Updating report status', [
                'report_id' => $id,
                'status' => $request->status,
                'admin_id' => Auth::id()
            ]);

            $request->validate([
                'status' => 'required|in:pending,in_review,resolved,dismissed',
                'admin_message' => 'nullable|string|max:1000',
            ]);

            $report = Report::with('reportedUser')->findOrFail($id);
            
            \Log::info('Report found', [
                'report_id' => $report->id,
                'has_reported_user' => $report->reportedUser !== null,
                'reported_user_id' => $report->reported_user_id
            ]);

            $report->status = $request->status;

            if ($request->status === 'resolved') {
                $report->resolved_at = now();
                // Get the admin record for the authenticated user
                $admin = Auth::user()->admin;
                if ($admin) {
                    $report->handled_by = $admin->id;
                }
                $report->save();

                // Send warning to the reported user
                $reportedUser = $report->reportedUser;
                if ($reportedUser) {
                    try {
                        $reportedUser->notify(new AccountReportedWarningNotification(
                            $report,
                            $request->input('admin_message')
                        ));
                        \Log::info('Notification sent to reported user', ['user_id' => $reportedUser->id]);
                    } catch (\Exception $notifError) {
                        \Log::error('Failed to send notification', [
                            'error' => $notifError->getMessage(),
                            'user_id' => $reportedUser->id
                        ]);
                    }

                    // Also send a chat message from "LiveFlow" so the user sees it in chat
                    try {
                        $adminMessage = $request->input('admin_message');
                        $warningText = 'Your account has been reported.';
                        if (!empty($adminMessage)) {
                            $warningText .= ' Message from the admin: ' . $adminMessage;
                        } else {
                            $warningText .= ' Please ensure your activity complies with our community guidelines.';
                        }

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
                            // Create via relation so user_id is set correctly
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
                            \Log::warning('Broadcast system warning failed (non-fatal): ' . $e->getMessage());
                        }

                        \Log::info('LiveFlow warning chat message sent', [
                            'conversation_id' => $conversation->id,
                            'reported_user_id' => $reportedUser->id,
                            'system_user_id' => $systemUser->id,
                        ]);
                    } catch (\Throwable $chatWarnError) {
                        \Log::error('Failed to send LiveFlow chat warning', [
                            'error' => $chatWarnError->getMessage(),
                            'user_id' => $reportedUser->id,
                            'report_id' => $report->id,
                        ]);
                    }
                } else {
                    \Log::warning('Reported user not found for report', ['report_id' => $id]);
                }
            } elseif ($request->status === 'dismissed') {
                $report->resolved_at = now();
                // Get the admin record for the authenticated user
                $admin = Auth::user()->admin;
                if ($admin) {
                    $report->handled_by = $admin->id;
                }
                $report->save();
            } else {
                $report->save();
            }

            return response()->json([
                'message' => $request->status === 'resolved'
                    ? 'Warning sent to user and report marked resolved.'
                    : 'Report status updated successfully.',
                'report' => $report->load('reportedUser.profile', 'reporter.profile'),
            ], 200);

        } catch (ValidationException $e) {
            \Log::error('Validation error in updateStatus', ['errors' => $e->errors()]);
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
                'code' => 422,
            ], 422);
        } catch (ModelNotFoundException $e) {
            \Log::error('Report not found', ['report_id' => $id]);
            return response()->json([
                'status' => 'error',
                'message' => 'Report not found.',
                'errors' => ["Report with ID {$id} does not exist."],
                'code' => 404,
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error updating report status', [
                'report_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'status' => 'error',
                'message' => 'An error occurred while updating the report.',
                'errors' => [$e->getMessage()],
                'code' => 500,
            ], 500);
        }
    }

    public function show($id){
        try{
            $report = Report::with(['reportedUser', 'reporter','handleBy.user'])
            ->findOrfail($id);

        return response()->json([
            'report' => $report
        ],200);
        }

        catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Report not found.',
                'errors' => ["Report with ID {$id} does not exist."],
                'code' => 404,
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'An error occurred while fetching the report.',
                'errors' => [$e->getMessage()],
                'code' => 500,
            ], 500);
        }
    }
    
}
