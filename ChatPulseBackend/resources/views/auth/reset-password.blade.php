<x-guest-layout>
    <div class="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {{ __('Reset Password') }}
        </h2>

        <!-- Session Status -->
        <x-auth-session-status class="mb-4 text-green-600 dark:text-green-400" :status="session('status')" />

        <!-- Validation Errors -->
        <x-input-error :messages="$errors->all()" class="mb-4 text-red-600 dark:text-red-400" />

        <form method="post" action="{{ route('password.update') }}">
            @csrf
            
            @method('PUT') <!-- This tells Laravel to treat it as PUT -->

            {{-- Hidden token field --}}
            <input type="hidden" name="token" value="{{ $token ?? '' }}">

            <!-- Email -->
            <div class="mb-4">
                <x-input-label for="email" :value="__('Email')" class="block text-gray-700 dark:text-gray-200 mb-2"/>
                <x-text-input id="email" type="email" name="email" 
                              :value="$email ?? old('email')" 
                              required autofocus />
            </div>

            <!-- Password -->
            <div class="mb-4">
                <x-input-label for="password" :value="__('New Password')" class="block text-gray-700 dark:text-gray-200 mb-2"/>
                <x-text-input id="password" type="password" name="password" required />
            </div>

            <!-- Confirm Password -->
            <div class="mb-4">
                <x-input-label for="password_confirmation" :value="__('Confirm Password')" class="block text-gray-700 dark:text-gray-200 mb-2"/>
                <x-text-input id="password_confirmation" type="password" name="password_confirmation" required />
            </div>

            <div class="flex items-center justify-end">
                <x-primary-button class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md">
                    {{ __('Reset Password') }}
                </x-primary-button>
            </div>
        </form>
    </div>
</x-guest-layout>
