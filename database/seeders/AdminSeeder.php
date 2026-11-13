<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    /**
     * Create the admin account, or reset it if it already exists.
     * Safe to run more than once: php artisan db:seed --class=AdminSeeder
     */
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@gmail.com'],
            ['name' => 'Admin', 'password' => 'admin123', 'email_verified_at' => now()],
        );

        $admin->forceFill(['is_admin' => true])->save();
    }
}
