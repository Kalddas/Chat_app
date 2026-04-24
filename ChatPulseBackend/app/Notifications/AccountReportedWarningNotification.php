<?php

namespace App\Notifications;

use App\Models\Report;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class AccountReportedWarningNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Report $report,
        public ?string $adminMessage = null
    ) {}

    /**
     * @return array<int, string>
     */
    public function via($notifiable): array
    {
        // Only use database for now (broadcast requires WebSocket server running)
        // To enable real-time: start WebSocket server and add 'broadcast' to array
        return ['database'];
    }

    public function toDatabase($notifiable): array
    {
        $message = 'Your account has been reported.';
        if (!empty($this->adminMessage)) {
            $message .= ' Message from the admin: ' . $this->adminMessage;
        } else {
            $message .= ' Please ensure your activity complies with our community guidelines.';
        }

        return [
            'type' => 'account_reported_warning',
            'report_id' => $this->report->id,
            'message' => $message,
            'admin_message' => $this->adminMessage,
            'created_at' => now()->toDateTimeString(),
        ];
    }

    public function toBroadcast($notifiable): BroadcastMessage
    {
        $message = 'Your account has been reported.';
        if (!empty($this->adminMessage)) {
            $message .= ' Message from the admin: ' . $this->adminMessage;
        } else {
            $message .= ' Please ensure your activity complies with our community guidelines.';
        }

        return new BroadcastMessage([
            'type' => 'account_reported_warning',
            'report_id' => $this->report->id,
            'message' => $message,
            'admin_message' => $this->adminMessage,
            'created_at' => now()->toDateTimeString(),
        ]);
    }
}
