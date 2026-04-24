<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Admin;
use App\Models\UserProfile;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminUser = User::create([
            'email' => 'admin@randomchat.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'email_verified_at' => now()

        ]);

        UserProfile::create([
            'first_name' => 'Admin',
            'last_name' => 'User',
            'user_name' => 'SuperAdmin',
            'bio' =>  'Super admin user',
            'status' => 'Active',
            'phone' => '+251912131415',
            'user_id' => $adminUser->id
        ]);

        Admin::create([
            'user_id' => $adminUser->id,
            'permission_level' => 'super_admin'
        ]);
    }
}
