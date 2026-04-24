@extends('layouts.app')

@section('content')
    <div class="bg-white shadow-md rounded-lg p-6">
        <h1 class="text-2xl font-bold mb-4">Your Conversations</h1>
        @if ($conversations->isEmpty())
            <p>No conversations found.</p>
        @else
            <ul class="space-y-4">
                @foreach ($conversations as $conversation)
                    <li class="border-b pb-2">
                        <a href="{{ route('chat.messages', $conversation->id) }}" class="flex justify-between items-center hover:bg-gray-100 p-2 rounded">
                            <div>
                                <strong>
                                    {{ $conversation->users->first()->profile->first_name ?? 'Unknown' }}
                                    {{ $conversation->users->first()->profile->last_name ?? '' }}
                                </strong>
                                <p class="text-gray-600">
                                    @if ($conversation->lastMessage)
                                        {{ Str::limit($conversation->lastMessage->message, 50) }}
                                    @else
                                        No messages yet.
                                    @endif
                                </p>
                            </div>
                            <span class="text-sm text-gray-500">
                                {{ $conversation->lastMessage ? $conversation->lastMessage->created_at->diffForHumans() : '' }}
                            </span>
                        </a>
                    </li>
                @endforeach
            </ul>
            {{ $conversations->links() }}
        @endif
        <div class="mt-4">
            <a href="{{ route('chat.requests') }}" class="text-blue-500">View Chat Requests</a>
        </div>
    </div>
@endsection
