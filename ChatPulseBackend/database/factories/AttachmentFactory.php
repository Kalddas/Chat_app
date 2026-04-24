<?php

namespace Database\Factories;

use App\Models\Message;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Attachment>
 */
class AttachmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'message_id' => fake()->boolean(50) // 50% chance to have attachment
                ? (Message::inRandomOrder()->first()->id ?? Message::factory())
                : null,
            'path' => 'string/path'
        ];
    }
}
