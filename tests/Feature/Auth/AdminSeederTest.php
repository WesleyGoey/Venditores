<?php

use App\Models\User;
use Database\Seeders\AdminSeeder;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Http::preventStrayRequests();
});

test('the admin seeder creates a verified admin in Supabase once', function () {
    Http::fake(['supabase.test/auth/v1/admin/users' => Http::response(['id' => '7f0c3a4e-1111-4b2c-9d3e-5f6a7b8c9d0e'])]);

    $this->seed(AdminSeeder::class);
    $this->seed(AdminSeeder::class);

    $admin = User::where('email', 'admin@gmail.com')->sole();

    expect($admin->is_admin)->toBeTrue()
        ->and($admin->hasVerifiedEmail())->toBeTrue()
        ->and($admin->supabase_id)->toBe('7f0c3a4e-1111-4b2c-9d3e-5f6a7b8c9d0e');

    Http::assertSentCount(1);
    Http::assertSent(fn (Request $request): bool => $request['email'] === 'admin@gmail.com' && $request['email_confirm'] === true);
});

test('an admin account that already exists in Supabase is linked at first login', function () {
    Http::fake(['supabase.test/auth/v1/admin/users' => Http::response(['error_code' => 'email_exists'], 422)]);

    $this->seed(AdminSeeder::class);

    $admin = User::where('email', 'admin@gmail.com')->sole();

    expect($admin->is_admin)->toBeTrue()
        ->and($admin->supabase_id)->toBeNull();
});

test('running the admin seeder again restores admin rights', function () {
    $admin = User::factory()->create(['email' => 'admin@gmail.com', 'supabase_id' => '7f0c3a4e-1111-4b2c-9d3e-5f6a7b8c9d0e', 'is_admin' => false]);

    $this->seed(AdminSeeder::class);

    expect($admin->fresh()->is_admin)->toBeTrue();
    Http::assertNothingSent();
});
