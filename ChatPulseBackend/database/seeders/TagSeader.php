<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Tag;
use App\Models\UserProfile;


class TagSeader extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $defaultTags = [
            ['name' => 'Technology'],
            ['name' => 'Science'],
            ['name' => 'Art'],
            ['name' => 'Music'],
            ['name' => 'Sports'],
            ['name' => 'Travel'],
            ['name' => 'Food'],
            ['name' => 'Fashion'],
            ['name' => 'Health'],
            ['name' => 'Education'],
            ['name' => 'Gaming'],
            ['name' => 'Movies'],
            ['name' => 'Books'],
            ['name' => 'Nature'],
            ['name' => 'Fitness'],
            ['name' => 'Photography'],
            ['name' => 'Business'],
            ['name' => 'History'],
            ['name' => 'Lifestyle'],
            ['name' => 'DIY'],
        ];

        foreach ($defaultTags as $tag) {
            Tag::firstOrCreate(['name' => $tag['name']]);
        }
    }
}
