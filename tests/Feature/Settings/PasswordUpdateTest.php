<?php


use App\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;


beforeEach(function () {
    Http::preventStrayRequests();
});


test('password is updated in Supabase', function () {
    $user = User::factory()->create(['supabase_id' => '7f0c3a4e-1111-4b2c-9d3e-5f6a7b8c9d0e']);


    Http::fake([
        'supabase.test/auth/v1/token*' => Http::response(['refresh_token' => 'refresh-token', 'user' => ['id' => $user->supabase_id]]),
        'supabase.test/auth/v1/admin/users/*' => Http::response(['id' => $user->supabase_id]),
    ]);


    $response = $this
        ->actingAs($user)
        ->from('/settings/password')
        ->put('/settings/password', [
            'current_password' => 'password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);


    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/settings/password');


    Http::assertSent(fn (Request $request): bool => $request->method() === 'PUT'
        && str_ends_with($request->url(), "admin/users/{$user->supabase_id}")
        && $request['password'] === 'new-password');
});


test('correct password must be provided to update password', function () {
    $user = User::factory()->create(['supabase_id' => '7f0c3a4e-1111-4b2c-9d3e-5f6a7b8c9d0e']);


    Http::fake(['supabase.test/auth/v1/token*' => Http::response(['error_code' => 'invalid_credentials'], 400)]);


    $response = $this
        ->actingAs($user)
        ->from('/settings/password')
        ->put('/settings/password', [
            'current_password' => 'wrong-password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);


    $response
        ->assertSessionHasErrors('current_password')
        ->assertRedirect('/settings/password');


    Http::assertNotSent(fn (Request $request): bool => str_contains($request->url(), 'admin/users'));
});
