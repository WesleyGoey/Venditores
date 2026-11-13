<?php

use App\Models\User;

test('it makes an existing user an admin', function () {
    $user = User::factory()->create();

    $this->artisan('user:make-admin', ['email' => $user->email])->assertSuccessful();

    expect($user->refresh()->is_admin)->toBeTrue();
});

test('it fails for an unknown email', function () {
    $this->artisan('user:make-admin', ['email' => 'nobody@example.com'])->assertFailed();
});

test('users are not admins by default and cannot make themselves one by mass assignment', function () {
    $user = User::factory()->create();

    $user->update(['is_admin' => true]);

    expect($user->refresh()->is_admin)->toBeFalse();
});
