<?php

use App\Models\User;
use Database\Seeders\AdminSeeder;
use Illuminate\Support\Facades\Hash;

test('the admin seeder creates a verified admin and can run again', function () {
    $this->seed(AdminSeeder::class);
    $this->seed(AdminSeeder::class);

    $admin = User::where('email', 'admin@gmail.com')->sole();

    expect($admin->is_admin)->toBeTrue()
        ->and($admin->hasVerifiedEmail())->toBeTrue()
        ->and(Hash::check('admin123', $admin->password))->toBeTrue();
});
