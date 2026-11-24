<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

/**
 * Supabase Auth owns the accounts: passwords, email confirmation and password resets.
 * Laravel keeps its own session and a local users row linked by supabase_id.
 *
 * Calls run on the server with the secret key, which must never reach the browser.
 */
class SupabaseAuth
{
    /**
     * Check an email and password. Returns the Supabase user, or null when they are wrong.
     * An unconfirmed email still means the password was right, so it returns a user without email_confirmed_at.
     *
     * @return array<string, mixed>|null
     */
    public function signIn(string $email, string $password): ?array
    {
        $response = $this->request()->post('token?grant_type=password', ['email' => $email, 'password' => $password]);

        if ($response->successful()) {
            session()->put('supabase.refresh_token', $response->json('refresh_token'));

            return $response->json('user');
        }

        return match ($response->json('error_code')) {
            'email_not_confirmed' => ['email' => $email, 'email_confirmed_at' => null],
            'invalid_credentials' => null,
            default => $this->fail($response, 'email'),
        };
    }

    /**
     * Create an account. Supabase emails the confirmation link. Returns the Supabase user id.
     */
    public function signUp(string $email, string $password, string $name): string
    {
        $response = $this->request()->post('signup?'.$this->redirectTo('verification.notice'), [
            'email' => $email,
            'password' => $password,
            'data' => ['name' => $name],
        ]);

        if ($response->failed()) {
            $this->fail($response, $response->json('error_code') === 'weak_password' ? 'password' : 'email');
        }

        return $response->json('user.id') ?? $response->json('id');
    }

    public function resendConfirmation(string $email): void
    {
        $response = $this->request()->post('resend?'.$this->redirectTo('verification.notice'), ['type' => 'signup', 'email' => $email]);

        if ($response->failed()) {
            $this->fail($response, 'email');
        }
    }

    /**
     * Supabase emails a link that comes back to the reset page with an access token in the URL fragment.
     */
    public function sendPasswordReset(string $email): void
    {
        $response = $this->request()->post('recover?'.$this->redirectTo('password.reset'), ['email' => $email]);

        if ($response->failed()) {
            $this->fail($response, 'email');
        }
    }

    public function resetPassword(string $accessToken, string $password): void
    {
        $response = $this->request()->withToken($accessToken)->put('user', ['password' => $password]);

        if ($response->status() === 401 || $response->status() === 403) {
            throw ValidationException::withMessages(['password' => 'This reset link is invalid or has expired. Request a new one.']);
        }

        if ($response->failed()) {
            $this->fail($response, 'password');
        }
    }

    /**
     * Ask Supabase to change the signed-in user's email. It only changes after the user confirms it by email.
     */
    public function changeEmail(string $email): void
    {
        $refreshed = $this->request()->post('token?grant_type=refresh_token', ['refresh_token' => session('supabase.refresh_token')]);

        if ($refreshed->failed()) {
            throw ValidationException::withMessages(['email' => 'Please log in again before changing your email.']);
        }

        session()->put('supabase.refresh_token', $refreshed->json('refresh_token'));

        $response = $this->request()
            ->withToken($refreshed->json('access_token'))
            ->put('user?'.$this->redirectTo('profile.edit'), ['email' => $email]);

        if ($response->failed()) {
            $this->fail($response, 'email');
        }
    }

    /**
     * The Supabase user, or an empty array when Supabase does not answer with one.
     *
     * @return array<string, mixed>
     */
    public function user(string $id): array
    {
        $response = $this->request()->get("admin/users/{$id}");

        return $response->successful() ? $response->json() : [];
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function updateUser(string $id, array $attributes): void
    {
        $response = $this->request()->put("admin/users/{$id}", $attributes);

        if ($response->failed()) {
            $this->fail($response, 'password');
        }
    }

    public function deleteUser(string $id): void
    {
        $this->request()->delete("admin/users/{$id}")->throw();
    }

    /**
     * Create an already confirmed account. Returns the id, or null when the email is taken.
     */
    public function createUser(string $email, string $password, string $name): ?string
    {
        $response = $this->request()->post('admin/users', [
            'email' => $email,
            'password' => $password,
            'email_confirm' => true,
            'user_metadata' => ['name' => $name],
        ]);

        if ($response->json('error_code') === 'email_exists') {
            return null;
        }

        return $response->throw()->json('id');
    }

    private function request(): PendingRequest
    {
        $url = config('services.supabase.url');
        $key = config('services.supabase.secret_key');

        if (blank($url) || blank($key)) {
            throw new RuntimeException('Supabase Auth is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env.');
        }

        // Secret keys are not JWTs, so they go on the apikey header only.
        return Http::baseUrl(rtrim($url, '/').'/auth/v1/')
            ->withHeaders(['apikey' => $key])
            ->acceptJson()
            ->connectTimeout(10)
            ->timeout(20)
            // Only connection drops are retried; Supabase's own error answers come back as they are.
            ->retry(3, 500, fn (Throwable $exception): bool => $exception instanceof ConnectionException, throw: false);
    }

    private function redirectTo(string $route): string
    {
        return http_build_query(['redirect_to' => route($route)]);
    }

    /**
     * @throws ValidationException
     */
    private function fail(Response $response, string $field): never
    {
        $message = match (true) {
            $response->status() === 429 => 'Too many attempts. Please wait a moment and try again.',
            $response->serverError() => 'The account service is unavailable. Please try again later.',
            default => $response->json('msg') ?? $response->json('error_description') ?? 'The account service rejected the request.',
        };

        throw ValidationException::withMessages([$field => $message]);
    }
}
