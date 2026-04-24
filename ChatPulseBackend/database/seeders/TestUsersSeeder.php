<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\Tag;
use Illuminate\Support\Facades\Hash;

class TestUsersSeeder extends Seeder
{
    public function run(): void
    {
        // Create test users with different interests
        $testUsers = [
            [
                'email' => 'alice@test.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'profile' => [
                    'first_name' => 'Alice',
                    'last_name' => 'Johnson',
                    'user_name' => 'alice_j',
                    'phone' => '1234567890',
                    'bio' => 'Love technology and music',
                    'status' => 'Active'
                ],
                'tags' => ['Technology', 'Music', 'Art']
            ],
            [
                'email' => 'bob@test.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'profile' => [
                    'first_name' => 'Bob',
                    'last_name' => 'Smith',
                    'user_name' => 'bob_s',
                    'phone' => '1234567891',
                    'bio' => 'Passionate about technology and sports',
                    'status' => 'Active'
                ],
                'tags' => ['Technology', 'Sports', 'Gaming']
            ],
            [
                'email' => 'carol@test.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'profile' => [
                    'first_name' => 'Carol',
                    'last_name' => 'Davis',
                    'user_name' => 'carol_d',
                    'phone' => '1234567892',
                    'bio' => 'Love art and music',
                    'status' => 'Active'
                ],
                'tags' => ['Art', 'Music', 'Books']
            ],
            [
                'email' => 'david@test.com',
                'password' => Hash::make('password'),
                'role' => 'user',
                'profile' => [
                    'first_name' => 'David',
                    'last_name' => 'Wilson',
                    'user_name' => 'david_w',
                    'phone' => '1234567893',
                    'bio' => 'Fitness enthusiast and traveler',
                    'status' => 'Active'
                ],
                'tags' => ['Fitness', 'Travel', 'Health']
            ]
        ];

        foreach ($testUsers as $userData) {
            $user = User::create([
                'email' => $userData['email'],
                'password' => $userData['password'],
                'role' => $userData['role'],
            ]);

            $user->profile()->create($userData['profile']);

            // Attach tags
            $tagIds = Tag::whereIn('name', $userData['tags'])->pluck('id');
            $user->tags()->attach($tagIds->mapWithKeys(fn($id) => [$id => ['weight' => 1.0]]));
        }
    }
}
