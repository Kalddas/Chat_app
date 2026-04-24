<?php

namespace App\Http\Controllers\Api\Users;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Validation\Rule;
use Psr\Http\Message\ResponseInterface;

class UserProfile extends Controller
{
    private const ALLOWED_MOODS = ['happy', 'sad', 'exhausted', 'anxious', 'calm', 'energetic', 'stressed'];

    private const ALLOWED_LANGUAGES = ['en', 'am'];

    public function index()
    {
        /** @var User */
        $user = Auth::user();
        $profile = $user->profile;
        
        // If profile doesn't exist, create a default one
        if (!$profile) {
            $profile = $user->profile()->create([
                'first_name' => '',
                'last_name' => '',
                'user_name' => 'user_' . $user->id,
                'phone' => '',
                'bio' => '',
                'status' => 'Active'
            ]);
        }
        
        return response()->json([
            'status' => 'success',
            'message' => 'User profile fetched successfully',
            'profile' =>  [
                'id' => $profile->id,
                'user_id' => $user->id,
                'first_name' => $profile->first_name,
                'last_name'  => $profile->last_name,
                'user_name'  => $profile->user_name,
                'phone'      => $profile->phone,
                'bio'        => $profile->bio,
                'profile_picture_url' => $user->profile_picture_url,
                'mood' => $user->mood,
                'mood_updated_at' => $user->mood_updated_at?->toDateTimeString(),
                'language' => $user->language ?? 'en',
            ],
            'selected_tags' => $user->tags->map(function ($tag) {
                return [
                    'id' => $tag->id,
                    'name' => $tag->name
                ];
            }),
        ]);
    }

    public function updateMood(Request $request)
    {
        /** @var User */
        $user = Auth::user();

        $validated = $request->validate([
            'mood' => ['required', 'string', Rule::in(self::ALLOWED_MOODS)],
        ]);

        $user->mood = $validated['mood'];
        $user->mood_updated_at = now();
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Mood updated successfully',
            'mood' => $user->mood,
            'mood_updated_at' => $user->mood_updated_at?->toDateTimeString(),
        ]);
    }

    public function updateLanguage(Request $request)
    {
        /** @var User */
        $user = Auth::user();

        $validated = $request->validate([
            'language' => ['required', 'string', Rule::in(self::ALLOWED_LANGUAGES)],
        ]);

        $user->language = $validated['language'];
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Language updated successfully',
            'language' => $user->language,
        ]);
    }

    public function getAvailableTags()
    {
        $user = Auth::user();
        $availableTags = Tag::whereDoesntHave('users', function ($query) use ($user) {
            $query->where('users.id', $user->id);
        })->get();

        return response()->json($availableTags);
    }

    public function update(Request $request)
    {
        /** @var User */
        $user = Auth::user();
        
        // Create profile if it doesn't exist
        if (!$user->profile) {
            $user->profile()->create([
                'first_name' => '',
                'last_name' => '',
                'user_name' => 'user_' . $user->id,
                'phone' => '',
                'bio' => '',
                'status' => 'Active'
            ]);
            $user->refresh();
        }

        $validated = $request->validate([
            'first_name' => ['sometimes', 'string'],
            'last_name' => ['sometimes', 'string'],
            'user_name' => ['sometimes', 'string', Rule::unique('user_profiles', 'user_name')->ignore($user->profile->id)],
            'phone' => ['sometimes', 'string'],
            'bio' => ['nullable', 'string'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['exists:tags,id'],
            'profile_picture' => ['sometimes', 'image', 'mimes:jpg,jpeg,png,webp,gif,bmp,svg,ico', 'max:5120']
        ]);
        $profileData = collect($validated)->except(['tags', 'profile_picture'])->toArray();

        // Handle profile picture upload
        if ($request->hasFile('profile_picture')) {
            // Store in public profile_pictures directory
            $imagePath = $request->file('profile_picture')->store('profile_pictures', 'public');
            
            if (!$imagePath) {
                \Log::error('Failed to store profile picture file', [
                    'user_id' => $user->id
                ]);
                return response()->json(['error' => 'Failed to store profile picture'], 500);
            }
            
            // Save to users table - ensure database save
            $user->profile_picture = $imagePath;
            $saved = $user->save();
            
            // Verify the save by refreshing from database
            $user->refresh();
            $dbValue = $user->profile_picture;
            
            \Log::info('Profile picture uploaded and saved to database:', [
                'user_id' => $user->id,
                'profile_picture_path' => $imagePath,
                'saved' => $saved,
                'database_value' => $dbValue,
                'matches' => $dbValue === $imagePath,
                'file_exists' => file_exists(storage_path('app/public/' . $imagePath))
            ]);
            
            if (!$saved || $dbValue !== $imagePath) {
                \Log::error('Profile picture database save failed:', [
                    'user_id' => $user->id,
                    'expected' => $imagePath,
                    'database_value' => $dbValue,
                    'saved' => $saved
                ]);
            }
        }

        $user->profile()->update($profileData);

        if (isset($validated['tags'])) {
            $user->tags()->sync(
                collect($validated['tags'])->mapWithKeys(fn($id) => [$id => ['weight' => 1.0]])
            );
        }

        // Refresh user to ensure we have latest database value
        $user->refresh();
        
        // Get the updated profile
        $updatedProfile = $user->profile->fresh();
        
        return response()->json([
            'message' => 'User profile updated successfully',
            'profile_picture_url' => $user->profile_picture_url,
            'user' => $user->load('profile'),
            'profile' => [
                'id' => $updatedProfile->id,
                'user_id' => $user->id,
                'first_name' => $updatedProfile->first_name,
                'last_name' => $updatedProfile->last_name,
                'user_name' => $updatedProfile->user_name,
                'phone' => $updatedProfile->phone,
                'bio' => $updatedProfile->bio,
                'profile_picture_url' => $user->profile_picture_url,
                'mood' => $user->mood,
                'mood_updated_at' => $user->mood_updated_at?->toDateTimeString(),
                'language' => $user->language ?? 'en',
            ],
        ]);
    }

    public function deleteTags(Request $request){
        /** @var User */
        $user = Auth::user();
        $validated = $request->validate([
            'tags' => ['nullable','array'],
            'tags.*' => ['exists:tags,id'],
            'delete_all' => ['boolean']
        ]);

        if(isset($validated['tags']) && !empty($validated['tags'])){
            $user->tags()->detach(collect($validated['tags']));
        }else{
            return response()->json([
                'error'=>'No tags selected'
            ],422);
        }

        return response()->json([
            'message' => 'Tags deleted seccessfully',
            'user' => $user->load('profile')->fresh(['tags'])
        ]);





    }
}
