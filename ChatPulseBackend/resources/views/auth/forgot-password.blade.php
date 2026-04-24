<x-guest-layout>
    <div class="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {{ __('Forgot Your Password?') }}
        </h2>

        <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {{ __('No worries! Just enter your email address and we will send you a link to reset your password.') }}
        </p>

        <!-- Session Status -->
        <x-auth-session-status class="mb-4 text-green-600 dark:text-green-400" :status="session('status')" />

        <!-- Validation Errors -->
        <x-input-error :messages="$errors->all()" class="mb-4 text-red-600 dark:text-red-400" />

        <form method="POST" action="{{ route('password.email') }}">
            @csrf

            <!-- Email Address -->
            <div class="mb-4">
                <x-input-label for="email" :value="__('Email')" class="block text-gray-700 dark:text-gray-200 mb-2"/>
                <x-text-input id="email" class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring focus:ring-indigo-400 dark:bg-gray-700 dark:text-gray-100" 
                              type="email" 
                              name="email" 
                              :value="old('email')" 
                              required 
                              autofocus />
            </div>

            <div class="flex items-center justify-end">
                <x-primary-button class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md">
                    {{ __('Email Password Reset Link') }}
                </x-primary-button>
            </div>
        </form>
    </div>
</x-guest-layout>
