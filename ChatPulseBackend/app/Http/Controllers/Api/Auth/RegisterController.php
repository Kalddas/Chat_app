<?php

namespace App\Http\Controllers\Api\Auth;

use \Illuminate\Validation\ValidationException;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Hash;
use App\Services\MatchingService;
use App\Services\OtpService;
use Illuminate\Support\Facades\Http;



class RegisterController extends Controller
{
    public function store(Request $request , OtpService $otpService)
    {
        try {
            $attributes = request()->validate([
                'email' => ['required', 'email', 'unique:users,email'],
                'password' => ['required', 'string', 'min:8', 'confirmed'],
                'user_name' => ['required', 'string', 'unique:user_profiles,user_name'],
                'first_name' => ['nullable', 'string', 'max:255'],
                'last_name' => ['nullable', 'string', 'max:255'],
                'bio' => ['required', 'string'],
                'phone' => ['required', 'string','unique:user_profiles,phone'],
                'tags' => ['required', 'array'],
                'tags.*' => ['exists:tags,id']
            ]);

            $user = User::create([
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'user',
            ]);

            $user->profile()->create([
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'user_name' => $request->user_name,
                'phone' => $request->phone,
                'bio' => $request->bio,
                'status' => 'Pending'
            ]);

            event(new Registered($user));
            //Attach tags with weight

            $user->tags()->attach($attributes['tags'], ['weight' => 1.0]);

            $otpService->sendOtp($user);
            //find matches immediately for the new user
            app(MatchingService::class)->findAndStoreMatches($user);
            
            // Also find matches for existing users who might match with this new user
            $this->findMatchesForExistingUsers($user);

            return response()->json([
                'message' => 'User successfully registered. Please verify your email with the OTP sent.',
                'user' => $user->load('profile')
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'messages' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        }
    }

    private function findMatchesForExistingUsers(User $newUser)
    {
        // Get all existing users who have tags
        $existingUsers = User::whereHas('tags')
            ->where('id', '!=', $newUser->id)
            ->get();

        $matchingService = app(MatchingService::class);

        foreach ($existingUsers as $existingUser) {
            // Check if they have any common tags
            $commonTags = $newUser->tags()->whereIn('tags.id', $existingUser->tags()->pluck('tags.id'))->count();
            
            if ($commonTags > 0) {
                // Find matches for the existing user with the new user
                $matchingService->findAndStoreMatches($existingUser);
            }
        }
    }
}
