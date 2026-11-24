<?php

use App\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Http::preventStrayRequests();
});

test('reset password link screen can be rendered', function () {
    $response = $this->get('/forgot-password');

    $response->assertStatus(200);
});

test('reset password link is requested from Supabase', function () {
    $user = User::factory()->create();

    Http::fake(['supabase.test/auth/v1/recover*' => Http::response([])]);

    $response = $this->post('/forgot-password', ['email' => $user->email]);

    $response->assertSessionHas('status');
    Http::assertSent(fn (Request $request): bool => $request['email'] === $user->email
        && str_contains(urldecode($request->url()), 'redirect_to='.route('password.reset')));
});

test('reset password screen can be rendered', function () {
    $response = $this->get('/reset-password');

    $response->assertStatus(200);
});

test('password can be reset with the token from the Supabase link', function () {
    Http::fake(['supabase.test/auth/v1/user' => Http::response(['id' => '7f0c3a4e-1111-4b2c-9d3e-5f6a7b8c9d0e'])]);

    $response = $this->post('/reset-password', [
        'token' => 'recovery-access-token',
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('login'));

    Http::assertSent(fn (Request $request): bool => $request->method() === 'PUT'
        && $request->hasHeader('Authorization', 'Bearer recovery-access-token')
        && $request['password'] === 'new-password');
});

test('an expired reset link is rejected', function () {
    Http::fake(['supabase.test/auth/v1/user' => Http::response(['msg' => 'invalid JWT'], 401)]);

    $response = $this->post('/reset-password', [
        'token' => 'expired-token',
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ]);

    $response->assertSessionHasErrors('password');
});
