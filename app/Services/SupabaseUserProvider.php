<?php

namespace App\Services;

use Illuminate\Auth\EloquentUserProvider;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Hashing\Hasher;

/**
 * Finds users in the local table but checks their password against Supabase Auth.
 * Used by login, password confirmation and every "current password" check.
 */
class SupabaseUserProvider extends EloquentUserProvider
{
    public function __construct(Hasher $hasher, string $model, private SupabaseAuth $supabase)
    {
        parent::__construct($hasher, $model);
    }

    /**
     * @param  array<string, mixed>  $credentials
     */
    public function validateCredentials(Authenticatable $user, #[\SensitiveParameter] array $credentials): bool
    {
        $account = $this->supabase->signIn($user->email, (string) ($credentials['password'] ?? ''));

        if ($account === null) {
            return false;
        }

        $user->forceFill(array_filter([
            'supabase_id' => $account['id'] ?? null,
            'email_verified_at' => $account['email_confirmed_at'] ?? null,
        ]))->save();

        return true;
    }

    /**
     * The local password hash is never checked, so there is nothing to rehash.
     *
     * @param  array<string, mixed>  $credentials
     */
    public function rehashPasswordIfRequired(Authenticatable $user, #[\SensitiveParameter] array $credentials, bool $force = false): void {}
}
