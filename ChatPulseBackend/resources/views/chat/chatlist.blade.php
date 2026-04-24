@extends('layouts.app')

@section('content')
    <div class="container mx-auto">
        <h2 class="text-xl font-bold mb-4">Chat List</h2>
        @foreach ($chats as $chat)
            <div class="border p-2 mb-2 rounded">
                <a href="{{ route('chat.messages', $chat['conversation_id']) }}">
                    <strong>{{ $chat['user']['user_name'] ?? ($chat['user']['first_name'] . ' ' . $chat['user']['last_name']) }}</strong>
                    <p>{{ $chat['last_message'] ? $chat['last_message']['message'] : 'No messages yet' }}</p>
                </a>
            </div>
        @endforeach
    </div>
@endsection
