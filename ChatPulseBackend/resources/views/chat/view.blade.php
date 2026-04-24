<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Chat - {{ $conversation->id }}</title>
    <!-- Include Tailwind CSS for styling (optional, you can use your own CSS) -->
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <style>
        #messages {
            height: 400px;
            overflow-y: auto;
            border: 1px solid #ccc;
            padding: 10px;
            margin-bottom: 10px;
        }

        .message {
            margin: 10px 0;
        }

        .message.sent {
            text-align: right;
            color: #2c5282;
        }

        .message.received {
            text-align: left;
            color: #2f855a;
        }
    </style>
</head>

<body class="bg-gray-100">
    <div class="container mx-auto p-4">
        <h1 class="text-2xl font-bold mb-4">Chat Conversation #{{ $conversation->id }}</h1>

        <!-- Messages container -->
        <div id="messages">
            @foreach ($messages as $message)
                <div class="message {{ auth()->user()->id === $message->sender->id ? 'sent' : 'received' }}">
                    <strong>{{ $message->sender->profile->first_name ?? 'Unknown' }}</strong>:
                    {{ $message->text }}
                    <small class="text-gray-500">{{ $message->created_at->diffForHumans() }}</small>
                </div>
            @endforeach
        </div>

        <!-- Message input form -->
        <form id="send-message-form" class="flex">
            <input type="hidden" name="receiver_id"
                value="{{ $conversation->users->where('id', '!=', auth()->user()->id)->first()->id }}">
            <input type="text" name="text" id="message-input" class="flex-1 p-2 border rounded-l"
                placeholder="Type your message..." required>
            <button type="submit" class="bg-blue-500 text-white p-2 rounded-r">Send</button>
        </form>
    </div>

    <!-- resources/views/chat/view.blade.php (JavaScript section only) -->
<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
<script src="{{ asset('vendor/reverb/reverb.js') }}"></script>
<script>
    // Set up CSRF token for Axios
    axios.defaults.headers.common['X-CSRF-TOKEN'] = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

    // Reverb setup with explicit configuration
    const Reverb = new Echo({
        broadcaster: 'reverb',
        key: '{{ env('REVERB_APP_KEY') }}',
        wsHost: '{{ env('REVERB_HOST') }}',
        wsPort: {{ env('REVERB_PORT') }},
        wssPort: {{ env('REVERB_PORT') }},
        forceTLS: {{ env('REVERB_SCHEME') === 'https' ? 'true' : 'false' }},
        enabledTransports: ['ws', 'wss'],
        disableStats: true
    });

    // Debug WebSocket connection
    Reverb.connector.socket.on('connect', () => {
        console.log('WebSocket connected successfully');
    });
    Reverb.connector.socket.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
    Reverb.connector.socket.on('close', () => {
        console.error('WebSocket connection closed');
    });

    // Subscribe to the public-chat channel
    Reverb.channel('public-chat')
        .listen('ChatEvent', (event) => {
            console.log('Received ChatEvent:', event);
            const messagesContainer = document.getElementById('messages');
            if (!messagesContainer || !event || !event.message) {
                console.error('Invalid event data or messages container:', event);
                return;
            }
            const messageDiv = document.createElement('div');
            const isSent = event.message.sender_id === {{ auth()->user()->id }};
            messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
            messageDiv.innerHTML = `
                <strong>User ${event.message.sender_id}</strong>: ${event.message.text}
                <small class="text-gray-500">${event.message.created_at}</small>
            `;
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight; // Auto-scroll to bottom
        })
        .subscribed(() => {
            console.log('Subscribed to public-chat channel');
        })
        .error((error) => {
            console.error('Channel subscription error:', error);
        });

    // Send message
    document.getElementById('send-message-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const messageInput = document.getElementById('message-input');
        const receiverId = document.querySelector('input[name="receiver_id"]').value;
        const messageText = messageInput.value;

        axios.post('/chat/{{ $conversation->id }}/send', {
            text: messageText,
            receiver_id: receiverId
        })
        .then(response => {
            messageInput.value = ''; // Clear input
            console.log('Message sent:', response.data);
        })
        .catch(error => {
            console.error('Error sending message:', error.response?.data || error);
            alert('Failed to send message: ' + (error.response?.data?.message || 'Unknown error'));
        });
    });
</script>
</body>

</html>
