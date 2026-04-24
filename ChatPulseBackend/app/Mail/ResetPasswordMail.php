<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ResetPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public $token;
    public $email;

    /**
     * Create a new message instance.
     */
    public function __construct($token,$email)
    {
        $this->token = $token;
        $this->email = $email;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reset Password Mail',
        );
    }

    /**
     * Get the message content definition.
     */
    // public function content(): Content
    // {
    //     $resetUrl = config('app.frontend_url','http://loclahost:3000').
    //                 "/reset-password?token={$this->token}&email={$this->email}";
    //     return new Content(
    //         text: 'emails.reset_password_plain',
    //         with: [
    //             'reset_url' => $resetUrl,
    //             'token' => $this->token,
    //             'email' => $this->email
    //         ]

    //     );
    // }

    public function build()
    {
        // Build a link to the frontend reset page instead of API endpoint
        $frontend = env('FRONTEND_URL', 'http://localhost:3000');
        $resetUrl = rtrim($frontend, '/') . "/reset-password?token={$this->token}&email={$this->email}";

        return $this->subject('Reset Password Request')
            ->view('emails.reset_password')
            ->with([
                'resetUrl' => $resetUrl,
                'token' => $this->token,
                'email' => $this->email,
            ]);
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
