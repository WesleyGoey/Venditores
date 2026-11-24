<?php

use App\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Http::preventStrayRequests();
});

test('registration screen can be rendered', function () {
    $response = $this->get('/register');

    $response->assertStatus(200);
});

test('new users are registered in Supabase Auth and linked locally', function () {
    Http::fake(['supabase.test/auth/v1/signup*' => Http::response([
        'id' => '7f0c3a4e-1111-4b2c-9d3e-5f6a7b8c9d0e',
        'email' => 'test@example.com',
        'email_confirmed_at' => null,
    ])]);

    $response = $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));

    $user = User::where('email', 'test@example.com')->sole();
    expect($user->supabase_id)->toBe('7f0c3a4e-1111-4b2c-9d3e-5f6a7b8c9d0e')
        ->and($user->hasVerifiedEmail())->toBeFalse();

    Http::assertSent(fn (Request $request): bool => str_contains($request->url(), 'redirect_to=')
        && $request['email'] === 'test@example.com'
        && $request['password'] === 'password'
        && $request['data'] === ['name' => 'Test User']);
});

test('nothing is saved when Supabase rejects the password', function () {
    Http::fake(['supabase.test/auth/v1/signup*' => Http::response(['error_code' => 'weak_password', 'msg' => 'Password is known to be weak and easy to guess.'], 422)]);

    $response = $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors(['password' => 'Password is known to be weak and easy to guess.']);
    expect(User::count())->toBe(0);
});
