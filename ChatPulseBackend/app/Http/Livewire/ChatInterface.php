<?php

namespace App\Http\Livewire;

use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Messages;
use App\Models\User;
use Livewire\Component;
use Livewire\WithFileUploads;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ChatInterface extends Component
{
    use WithFileUploads;

    public $conversation;
    public $message = '';
    public $attachment;
    public $messages = [];
    public $conversationId;

    protected $listeners = [
        'echo-private:conversation.{conversationId},MessageSent' => 'handleBroadcastedMessage',
        'messageSent' => 'handleMessageSent'
    ];

    public function mount($conversationId)
    {
        $this->conversationId = $conversationId;
        $this->conversation = Conversation::findOrFail($conversationId);

        // Check if user is part of the conversation
        $user = Auth::user();
        if (!$this->conversation->users()->where('user_id', $user->id)->exists()) {
            abort(403, 'Unauthorized access to conversation');
        }

        $this->loadMessages();
    }

    public function loadMessages()
    {
        $this->messages = Messages::where('conversation_id', $this->conversationId)
            ->with(['user', 'attachments'])
            ->orderBy('created_at', 'asc')
            ->get();
    }

    public function sendMessage()
    {
        $this->validate([
            'message' => 'nullable|string',
            'attachment' => 'nullable|file|max:10240',
        ]);

        if (empty($this->message) && !$this->attachment) {
            return;
        }

        $user = Auth::user();

        $message = Messages::create([
            'conversation_id' => $this->conversationId,
            'user_id' => $user->id,
            'message' => $this->message,
        ]);

        if ($this->attachment) {
            $path = $this->attachment->store('attachments', 'public');

            $message->attachments()->create([
                'file_path' => $path,
                'file_type' => $this->attachment->getClientMimeType(),
                'file_size' => $this->attachment->getSize(),
            ]);
        }

        $message->load('attachments');

        // Keep message sending successful even if websocket server is unavailable.
        try {
            broadcast(new MessageSent($message));
        } catch (\Throwable $broadcastException) {
            Log::warning('Livewire message broadcast failed (non-fatal): ' . $broadcastException->getMessage());
        }

        // Reset form
        $this->message = '';
        $this->attachment = null;

        // Reload messages immediately
        $this->loadMessages();

        // Dispatch scroll event
        $this->dispatchBrowserEvent('scroll-to-bottom');
    }

    public function handleMessageSent($messageId)
    {
        $this->loadMessages();
        $this->dispatchBrowserEvent('scroll-to-bottom');
    }

    public function handleBroadcastedMessage($event)
    {
        $this->loadMessages();
        $this->dispatchBrowserEvent('scroll-to-bottom');
    }

    public function render()
    {
        return view('livewire.chat-interface', [
            'conversation' => $this->conversation,
            'allMessages' => $this->messages,
        ]);
    }
}
