<?php


namespace App\Http\Controllers\Settings;


use App\Http\Controllers\Controller;
use App\Services\SupabaseAuth;
use Closure;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;


class PasswordController extends Controller
{
    /**
     * Show the user's password settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/password', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }


    /**
     * Update the user's password in Supabase Auth.
     */
    public function update(Request $request, SupabaseAuth $supabase): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string', self::currentPassword($request)],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);


        $supabase->updateUser($request->user()->supabase_id, ['password' => $validated['password']]);


        return back();
    }


    /**
     * Rule that checks the signed-in user's password against Supabase Auth.
     */
    public static function currentPassword(Request $request): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) use ($request): void {
            if (! Auth::guard('web')->validate(['email' => $request->user()->email, 'password' => $value])) {
                $fail(__('validation.current_password'));
            }
        };
    }
}
