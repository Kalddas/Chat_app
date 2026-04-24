<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TempPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public $temporaryPassword;
    public $email;

    /**
     * Create a new message instance.
     */
    public function __construct($temporaryPassword, $email)
    {
        $this->temporaryPassword = $temporaryPassword;
        $this->email = $email;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Temporary Password - Action Required',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        // Use config() instead of env() for better performance and caching support
        $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000'));
        
        return new Content(
            view: 'emails.temp_password',
            with: [
                'temporaryPassword' => $this->temporaryPassword,
                'email' => $this->email,
                'loginUrl' => rtrim($frontendUrl, '/') . '/login?email=' . urlencode($this->email),
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}

