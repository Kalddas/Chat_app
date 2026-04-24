<?php

namespace Database\Factories;

use App\Models\Attachment;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Message>
 */
class MessageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'sender_id' => User::inRandomOrder()->first()->id ?? User::factory(),
            'receiver_id' => User::inRandomOrder()->first()->id ?? User::factory(),
            'conversation_id' => Conversation::inRandomOrder()->first()->id ?? Conversation::factory(),
            'text' => fake()->text(),
        ];
    }
}
