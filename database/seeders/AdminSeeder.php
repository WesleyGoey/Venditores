<?php

namespace Database\Seeders;

use App\Models\User;
use App\Services\SupabaseAuth;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    /**
     * Create the admin account if it is missing and make sure it is an admin.
     * The Supabase Auth account is only created once, so a password changed after
     * the first login survives every deploy. Safe to run more than once.
     */
    public function run(SupabaseAuth $supabase): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@gmail.com'],
            ['name' => 'Admin', 'password' => 'admin123', 'email_verified_at' => now()],
        );

        if ($admin->supabase_id === null && filled(config('services.supabase.url'))) {
            // Null when the account already exists in Supabase; the first login links it.
            $admin->supabase_id = $supabase->createUser($admin->email, 'admin123', $admin->name);
        }

        $admin->forceFill(['is_admin' => true])->save();
    }
}
