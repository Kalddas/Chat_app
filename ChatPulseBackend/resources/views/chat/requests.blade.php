@extends('layouts.app')

@section('content')
    <div class="container mx-auto">
        <h2 class="text-xl font-bold mb-4">Pending Chat Requests</h2>
        @foreach ($pendingRequests as $request)
            <div class="border p-2 mb-2 rounded">
                <p>From: {{ $request['sender_name'] }} (@if($request['user_name']){{ $request['user_name'] }}@endif)</p>
                <form action="{{ route('chat.accept', $request['request_id']) }}" method="POST" style="display:inline;">
                    @csrf
                    <button type="submit" class="bg-green-500 text-white px-2 py-1 rounded">Accept</button>
                </form>
                <form action="{{ route('chat.reject', $request['request_id']) }}" method="POST" style="display:inline;">
                    @csrf
                    <button type="submit" class="bg-red-500 text-white px-2 py-1 rounded">Reject</button>
                </form>
            </div>
        @endforeach
    </div>
@endsection
