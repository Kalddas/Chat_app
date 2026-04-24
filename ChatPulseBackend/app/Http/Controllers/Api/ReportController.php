<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Report;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\AdminActionLog;
use App\Models\UserProfile;
use Illuminate\Support\Facades\Storage;

class ReportController extends Controller
{
    // Create a new report (auth required)
    public function store(Request $request)
    {
        \Log::info('Report API endpoint hit', [
            'method' => $request->method(),
            'url' => $request->url(),
            'headers' => $request->headers->all(),
            'user_authenticated' => Auth::check(),
            'user_id' => Auth::id()
        ]);
        
        try {
            /** @var \App\Models\User */
            $user = Auth::user();
            
            \Log::info('Report submission attempt', [
                'user_id' => $user?->id,
                'request_data' => $request->all(),
                'has_file' => $request->hasFile('image')
            ]);
            
            if (!$user) {
                \Log::error('User not authenticated for report submission');
                return response()->json(['error' => 'User not authenticated'], 401);
            }

            $validated = $request->validate([
                'title' => ['required','string','max:255'],
                'message' => ['required','string'],
                'image' => ['nullable','image','mimes:jpeg,png,jpg,gif,webp','max:2048'],
                'reported_user_id' => ['nullable','string','exists:users,id'],
                'conversation_id' => ['nullable','string','exists:conversations,id'],
            ]);

            $path = null;
            if ($request->hasFile('image')) {
                $path = $request->file('image')->store('reports', 'public');
            }

            $report = Report::create([
                'title' => $validated['title'],
                'message' => $validated['message'],
                'image' => $path,
                'reporter_user_id' => $user->id,
                'reported_user_id' => $validated['reported_user_id'] ? (int)$validated['reported_user_id'] : null,
                'type' => 'user_report', // Default type for user reports
                'reason' => 'User reported via chat interface',
                'status' => 'pending',
            ]);

            \Log::info('Report created successfully', [
                'report_id' => $report->id,
                'reporter_id' => $report->reporter_user_id,
                'reported_user_id' => $report->reported_user_id
            ]);

            // Automated warning/suspension is handled by ReportObserver on report creation.

            return response()->json([
                'message' => 'Report submitted successfully',
                'report' => $report,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'details' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Report submission failed: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to submit report',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Export authenticated user's chat data and create a report to notify admin
    public function exportChats(Request $request)
    {
        /** @var \App\Models\User */
        $user = Auth::user();

        $conversations = Conversation::whereHas('users', function($q) use ($user) {
            $q->where('user_id', $user->id);
        })->with(['users:id,email', 'messages' => function($q){
            $q->with(['attachments:id,message_id,file_path,file_type,file_size']);
        }])->get();

        $exportPayload = [
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
            ],
            'exported_at' => now()->toIso8601String(),
            'conversations' => $conversations,
        ];

        $fileName = 'chat_exports/'.now()->format('Ymd_His')."_user_{$user->id}.json";
        Storage::disk('public')->put($fileName, json_encode($exportPayload));

        $report = Report::create([
            'title' => 'Chat data export',
            'message' => 'Automatic chat export submitted by user',
            'image' => $fileName, // store export file path so dashboard can link it
            'reporter_user_id' => $user->id,
            'status' => 'pending',
        ]);

        // Log the chat export action
        AdminActionLog::create([
            'admin_user_id' => null, // User-initiated action
            'target_user_id' => $user->id,
            'action' => 'chat_exported',
            'details' => [
                'file_url' => asset('storage/'.$fileName),
                'conversations_count' => $conversations->count(),
                'user_email' => $user->email
            ],
            'description' => "User exported chat data - {$conversations->count()} conversations"
        ]);

        return response()->json([
            'message' => 'Chat data exported and sent to admin',
            'report' => $report,
            'file_url' => asset('storage/'.$fileName),
        ], 201);
    }
}



