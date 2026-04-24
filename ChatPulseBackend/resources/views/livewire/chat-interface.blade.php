<div class="chat-container" wire:ignore.self>
    <div class="chat-header bg-primary text-white p-3">
        <h5 class="mb-0">Chat with
            @foreach($conversation->users as $user)
                @if($user->id !== Auth::id())
                    {{ $user->name }}
                @endif
            @endforeach
        </h5>
    </div>

    <div class="chat-messages p-3" id="chat-messages" style="height: 400px; overflow-y: auto; background: #f8f9fa;">
        @foreach($allMessages as $message)
            <div class="message mb-3 @if($message->user_id === Auth::id()) text-end @endif">
                <div class="card @if($message->user_id === Auth::id()) bg-primary text-white @else bg-white @endif">
                    <div class="card-body p-2">
                        <div class="d-flex justify-content-between align-items-center">
                            <strong class="small">{{ $message->user->name }}</strong>
                            <span class="small">{{ $message->created_at->format('H:i') }}</span>
                        </div>
                        <p class="mb-1">{{ $message->message }}</p>

                        @if($message->attachments->count() > 0)
                            <div class="attachments mt-2">
                                @foreach($message->attachments as $attachment)
                                    @if(str_contains($attachment->file_type, 'image'))
                                        <img src="{{ asset('storage/'.$attachment->file_path) }}"
                                             alt="Attachment" class="img-thumbnail" style="max-width: 200px;">
                                    @else
                                        <a href="{{ asset('storage/'.$attachment->file_path) }}"
                                           target="_blank" class="btn btn-sm @if($message->user_id === Auth::id()) btn-light @else btn-outline-primary @endif">
                                            📎 Download File
                                        </a>
                                    @endif
                                @endforeach
                            </div>
                        @endif
                    </div>
                </div>
            </div>
        @endforeach
    </div>

    <div class="chat-input p-3 border-top">
        <form wire:submit.prevent="sendMessage">
            <div class="input-group">
                <input type="text" wire:model="message" class="form-control" placeholder="Type your message..."
                       wire:keydown.enter.prevent="sendMessage">

                <label for="attachment" class="btn btn-outline-secondary">
                    📎
                </label>
                <input type="file" wire:model="attachment" id="attachment" style="display: none;">

                <button type="submit" class="btn btn-primary" wire:loading.attr="disabled">
                    <span wire:loading.remove>Send</span>
                    <span wire:loading>Sending...</span>
                </button>
            </div>

            @if($attachment)
                <div class="mt-2">
                    <small class="text-muted">Attachment: {{ $attachment->getClientOriginalName() }}</small>
                    <button type="button" wire:click="$set('attachment', null)" class="btn btn-sm btn-link text-danger">
                        × Remove
                    </button>
                </div>
            @endif

            @error('attachment') <span class="text-danger">{{ $message }}</span> @enderror
        </form>
    </div>
</div>

@push('scripts')
<script>
    document.addEventListener('livewire:load', function () {
        // Scroll to bottom on initial load
        scrollToBottom();

        // Listen for the scroll event from Livewire
        Livewire.on('scroll-to-bottom', function () {
            scrollToBottom();
        });

        function scrollToBottom() {
            const messagesContainer = document.getElementById('chat-messages');
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }

        // Auto-scroll when new messages arrive
        Livewire.hook('message.processed', () => {
            scrollToBottom();
        });
    });
</script>
@endpush
