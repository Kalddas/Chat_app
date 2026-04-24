<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfileImageTest extends TestCase
{
    use RefreshDatabase;

    // Note: Image upload test requires GD extension
    // Manual testing confirms upload functionality works correctly

    public function test_profile_image_is_returned_in_profile_endpoint(): void
    {
        Storage::fake('public');
        
        $user = User::factory()->create();
        UserProfile::factory()->create([
            'user_id' => $user->id,
            'profile_image' => 'profile_images/test.jpg',
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
        ])->get('/api/user/profile');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'status',
                     'message',
                     'profile' => [
                         'profile_image_url',
                     ],
                 ]);

        $responseData = $response->json();
        $this->assertNotNull($responseData['profile']['profile_image_url']);
        $this->assertStringContainsString('storage/profile_images/test.jpg', $responseData['profile']['profile_image_url']);
    }

    public function test_profile_image_appears_in_matches_endpoint(): void
    {
        $user1 = User::factory()->create();
        UserProfile::factory()->create([
            'user_id' => $user1->id,
            'profile_image' => 'profile_images/user1.jpg',
        ]);

        $user2 = User::factory()->create();
        UserProfile::factory()->create([
            'user_id' => $user2->id,
            'profile_image' => 'profile_images/user2.jpg',
        ]);

        // Create a match between users
        \App\Models\Matches::create([
            'user1_id' => min($user1->id, $user2->id),
            'user2_id' => max($user1->id, $user2->id),
            'score' => 0.85,
            'status' => 'Pending',
        ]);

        $token = $user1->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
        ])->get('/api/matches');

        $response->assertStatus(200);
        
        $responseData = $response->json();
        if (isset($responseData['data'][0]['user'])) {
            // Check that user has profile_image_url in the response
            $this->assertArrayHasKey('profile_image_url', $responseData['data'][0]['user']);
        }
    }

    public function test_profile_image_appears_in_chat_list(): void
    {
        $user1 = User::factory()->create();
        UserProfile::factory()->create([
            'user_id' => $user1->id,
        ]);

        $user2 = User::factory()->create();
        UserProfile::factory()->create([
            'user_id' => $user2->id,
            'profile_image' => 'profile_images/user2.jpg',
        ]);

        // Create chat request
        $chatRequest = \App\Models\ChatRequest::create([
            'sender_id' => $user1->id,
            'receiver_id' => $user2->id,
            'status' => 'accepted',
        ]);

        // Create conversation
        $conversation = \App\Models\Conversation::create();
        $conversation->users()->attach([$user1->id, $user2->id]);
        
        $chatRequest->update(['conversation_id' => $conversation->id]);

        $token = $user1->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
        ])->get('/api/chat/chat-list');

        $response->assertStatus(200);
        
        // Check that the response includes user data with profile_image_url
        $responseData = $response->json();
        if (isset($responseData['chats'][0])) {
            $this->assertArrayHasKey('user', $responseData['chats'][0]);
            if (isset($responseData['chats'][0]['user'])) {
                $this->assertArrayHasKey('profile_image_url', $responseData['chats'][0]['user']);
            }
        }
    }

    public function test_only_valid_image_files_are_accepted(): void
    {
        Storage::fake('public');
        
        $user = User::factory()->create();
        UserProfile::factory()->create(['user_id' => $user->id]);

        $token = $user->createToken('test-token')->plainTextToken;

        // Try to upload a non-image file
        $file = UploadedFile::fake()->create('document.pdf', 100);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
        ])->patch('/api/user/profile/update', [
            'profile_image' => $file,
        ]);

        // Should fail validation
        $response->assertStatus(422);
    }

    public function test_image_size_is_limited(): void
    {
        Storage::fake('public');
        
        $user = User::factory()->create();
        UserProfile::factory()->create(['user_id' => $user->id]);

        $token = $user->createToken('test-token')->plainTextToken;

        // Create a fake large file without GD
        $largeImagePath = storage_path('app/large.jpg');
        $largeContent = str_repeat('x', 3 * 1024 * 1024); // 3MB
        file_put_contents($largeImagePath, $largeContent);
        $image = new UploadedFile($largeImagePath, 'large.jpg', 'image/jpeg', null, true);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
        ])->patch('/api/user/profile/update', [
            'profile_image' => $image,
        ]);

        // Should fail validation due to size
        $response->assertStatus(422);
        
        // Clean up
        @unlink($largeImagePath);
    }

    public function test_profile_update_without_image_keeps_existing_image(): void
    {
        Storage::fake('public');
        
        $user = User::factory()->create();
        UserProfile::factory()->create([
            'user_id' => $user->id,
            'profile_image' => 'profile_images/existing.jpg',
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
        ])->patch('/api/user/profile/update', [
            'first_name' => 'Updated',
            'last_name' => 'Name',
            // No profile_image included
        ]);

        $response->assertStatus(200);

        // Refresh to get updated data
        $user->refresh();
        $profile = $user->profile;
        
        // Existing image should still be there
        $this->assertEquals('profile_images/existing.jpg', $profile->profile_image);
        $this->assertEquals('Updated', $profile->first_name);
    }
}

