@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-8">
            <div class="card">
                <div class="card-header">Chat</div>

                <div class="card-body p-0">
                    {{-- Use kebab-case here --}}
                    @livewire('chat-interface', ['conversationId' => $conversationId])
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
