<!DOCTYPE html>
<html>
<head>
    <title>Chat Test</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <script src="https://js.pusher.com/8.2/pusher.min.js"></script>
    <script src="{{ asset('js/echo.js') }}"></script>
</head>
<body>
    <h1>Private Chat Test</h1>
    <div id="messages"></div>
    <input type="text" id="message-input" placeholder="Type a message">
    <button onclick="sendMessage()">Send</button>

    <script>
        window.Echo = new Echo({
            broadcaster: 'reverb',
            key: '{{ env('REVERB_APP_KEY') }}', // 89pbiicfbhrz8hbnb8ai
            wsHost: '{{ env('REVERB_HOST', '127.0.0.1') }}',
            wsPort: {{ env('REVERB_PORT', 6001) }},
            forceTLS: false,
            enabledTransports: ['ws'],
        });

        Echo.private('private-conversation.1')
            .listen('ChatEvent', (e) => {
                console.log('Message received:', e);
                document.getElementById('messages').innerHTML += `<p>${e.message.message}</p>`;
            })
            .error((error) => {
                console.error('Subscription error:', error);
            });

        function sendMessage() {
            const input = document.getElementById('message-input');
            const message = input.value;
            fetch('/send-message', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ message, conversation_id: 1 })
            }).then(response => response.json())
              .then(data => console.log('Message sent:', data))
              .catch(error => console.error('Send error:', error));
            input.value = '';
        }
    </script>
</body>
</html>
