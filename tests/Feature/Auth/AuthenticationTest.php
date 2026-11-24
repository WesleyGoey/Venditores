<?php

use App\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Http::preventStrayRequests();
});

test('login screen can be rendered', function () {
    $response = $this->get('/login');

    $response->assertStatus(200);
});

test('users can authenticate with their Supabase password', function () {
    $user = User::factory()->unverified()->create();

    Http::fake(['supabase.test/auth/v1/token*' => Http::response([
        'access_token' => 'access-token',
        'refresh_token' => 'refresh-token',
        'user' => ['id' => '7f0c3a4e-1111-4b2c-9d3e-5f6a7b8c9d0e', 'email' => $user->email, 'email_confirmed_at' => '2026-11-20T10:00:00Z'],
    ])]);

    $response = $this->post('/login', [
        'email' => $user->email,
        'password' => 'secret-password',
    ]);

    $this->assertAuthenticatedAs($user);
    $response->assertRedirect(route('dashboard', absolute: false));
    $response->assertSessionHas('supabase.refresh_token', 'refresh-token');

    $user->refresh();
    expect($user->supabase_id)->toBe('7f0c3a4e-1111-4b2c-9d3e-5f6a7b8c9d0e')
        ->and($user->hasVerifiedEmail())->toBeTrue();

    Http::assertSent(fn (Request $request): bool => $request->hasHeader('apikey', 'sb_secret_testing')
        && $request['email'] === $user->email
        && $request['password'] === 'secret-password');
});

test('a dropped connection to Supabase is retried', function () {
    $user = User::factory()->create();

    Http::fake(['supabase.test/auth/v1/token*' => Http::sequence()
        ->pushFailedConnection()
        ->push(['refresh_token' => 'refresh-token', 'user' => ['id' => '7f0c3a4e-1111-4b2c-9d3e-5f6a7b8c9d0e']])]);

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'secret-password',
    ]);

    $this->assertAuthenticatedAs($user);
});

test('users can not authenticate with a wrong password', function () {
    $user = User::factory()->create();

    Http::fake(['supabase.test/auth/v1/token*' => Http::response(['error_code' => 'invalid_credentials', 'msg' => 'Invalid login credentials'], 400)]);

    $response = $this->post('/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors('email');
});

test('users with an unconfirmed email are logged in but must still verify it', function () {
    $user = User::factory()->unverified()->create();

    Http::fake(['supabase.test/auth/v1/token*' => Http::response(['error_code' => 'email_not_confirmed', 'msg' => 'Email not confirmed'], 400)]);

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'secret-password',
    ]);

    $this->assertAuthenticatedAs($user);
    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});

test('users can logout', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/logout');

    $this->assertGuest();
    $response->assertRedirect('/');
});
