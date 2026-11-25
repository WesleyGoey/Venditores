<?php


use App\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;


beforeEach(function () {
    Http::preventStrayRequests();
});


test('profile page is displayed', function () {
    $user = User::factory()->create();


    $response = $this
        ->actingAs($user)
        ->get('/settings/profile');


    $response->assertOk();
});


test('profile page picks up an email change confirmed in Supabase', function () {
    $user = User::factory()->create(['supabase_id' => '7f0c3a4e-1111-4b2c-9d3e-5f6a7b8c9d0e']);


    Http::fake(['supabase.test/auth/v1/admin/users/*' => Http::response(['id' => $user->supabase_id, 'email' => 'new@example.com'])]);


    $this->actingAs($user)->get('/settings/profile')->assertOk();


    expect($user->fresh()->email)->toBe('new@example.com');
});


test('profile name can be updated', function () {
    $user = User::factory()->create();


    $response = $this
        ->actingAs($user)
        ->patch('/settings/profile', [
            'name' => 'Test User',
            'email' => $user->email,
        ]);


    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/settings/profile');


    $user->refresh();


    expect($user->name)->toBe('Test User')
        ->and($user->email_verified_at)->not->toBeNull();
});


test('a new email is sent to Supabase and only changes after confirmation', function () {
    $user = User::factory()->create();


    Http::fake([
        'supabase.test/auth/v1/token*' => Http::response(['access_token' => 'access-token', 'refresh_token' => 'new-refresh-token']),
        'supabase.test/auth/v1/user*' => Http::response(['id' => '7f0c3a4e-1111-4b2c-9d3e-5f6a7b8c9d0e']),
    ]);


    $response = $this
        ->actingAs($user)
        ->withSession(['supabase.refresh_token' => 'refresh-token'])
        ->patch('/settings/profile', [
            'name' => $user->name,
            'email' => 'new@example.com',
        ]);


    $response
        ->assertSessionHasNoErrors()
        ->assertSessionHas('status', 'email-change-sent')
        ->assertRedirect('/settings/profile');


    expect($user->fresh()->email)->not->toBe('new@example.com');


    Http::assertSent(fn (Request $request): bool => $request->method() === 'PUT'
        && $request->hasHeader('Authorization', 'Bearer access-token')
        && $request['email'] === 'new@example.com');
});


test('user can delete their account', function () {
    $user = User::factory()->create(['supabase_id' => '7f0c3a4e-1111-4b2c-9d3e-5f6a7b8c9d0e']);


    Http::fake([
        'supabase.test/auth/v1/token*' => Http::response(['refresh_token' => 'refresh-token', 'user' => ['id' => $user->supabase_id]]),
        'supabase.test/auth/v1/admin/users/*' => Http::response([]),
    ]);


    $response = $this
        ->actingAs($user)
        ->delete('/settings/profile', [
            'password' => 'password',
        ]);


    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');


    $this->assertGuest();
    expect($user->fresh())->toBeNull();


    Http::assertSent(fn (Request $request): bool => $request->method() === 'DELETE'
        && str_ends_with($request->url(), 'admin/users/7f0c3a4e-1111-4b2c-9d3e-5f6a7b8c9d0e'));
});


test('correct password must be provided to delete account', function () {
    $user = User::factory()->create(['supabase_id' => '7f0c3a4e-1111-4b2c-9d3e-5f6a7b8c9d0e']);


    Http::fake(['supabase.test/auth/v1/token*' => Http::response(['error_code' => 'invalid_credentials'], 400)]);


    $response = $this
        ->actingAs($user)
        ->from('/settings/profile')
        ->delete('/settings/profile', [
            'password' => 'wrong-password',
        ]);


    $response
        ->assertSessionHasErrors('password')
        ->assertRedirect('/settings/profile');


    expect($user->fresh())->not->toBeNull();
});
