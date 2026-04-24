<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Conversation;
use App\Models\User;

class Conversation_User extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // After creating users and conversations
        $users = User::all();
        $conversations = Conversation::all();

        foreach ($conversations as $conversation) {
            // Pick 2 random users for each conversation
            $participants = $users->random(2);

            foreach ($participants as $user) {
                $conversation->users()->attach($user->id, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

    }
}
