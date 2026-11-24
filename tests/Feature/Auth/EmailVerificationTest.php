<?php

use App\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Http::preventStrayRequests();
});

test('email verification screen is shown while Supabase has not confirmed the email', function () {
    $user = User::factory()->unverified()->create(['supabase_id' => '7f0c3a4e-1111-4b2c-9d3e-5f6a7b8c9d0e']);

    Http::fake(['supabase.test/auth/v1/admin/users/*' => Http::response(['id' => $user->supabase_id, 'email_confirmed_at' => null])]);

    $response = $this->actingAs($user)->get('/verify-email');

    $response->assertStatus(200);
    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});

test('an email confirmed in Supabase is marked verified', function () {
    $user = User::factory()->unverified()->create(['supabase_id' => '7f0c3a4e-1111-4b2c-9d3e-5f6a7b8c9d0e']);

    Http::fake(['supabase.test/auth/v1/admin/users/*' => Http::response(['id' => $user->supabase_id, 'email_confirmed_at' => '2026-11-20T10:00:00Z'])]);

    $response = $this->actingAs($user)->get('/verify-email');

    $response->assertRedirect(route('dashboard', absolute: false));
    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
});

test('the confirmation email is resent through Supabase', function () {
    $user = User::factory()->unverified()->create();

    Http::fake(['supabase.test/auth/v1/resend*' => Http::response([])]);

    $response = $this->actingAs($user)->post('/email/verification-notification');

    $response->assertSessionHas('status', 'verification-link-sent');
    Http::assertSent(fn (Request $request): bool => $request['type'] === 'signup' && $request['email'] === $user->email);
});
