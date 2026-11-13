<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    /**
     * Create the admin account if it is missing and make sure it is an admin.
     * An existing password is never overwritten, so changing it after the first
     * login survives every deploy. Safe to run more than once.
     */
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@gmail.com'],
            ['name' => 'Admin', 'password' => 'admin123', 'email_verified_at' => now()],
        );

        $admin->forceFill(['is_admin' => true])->save();
    }
}
