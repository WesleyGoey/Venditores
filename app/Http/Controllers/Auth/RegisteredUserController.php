<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\SupabaseAuth;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request, SupabaseAuth $supabase): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'account_type' => ['nullable', 'in:user,vendor'],
        ]);

        // Supabase stores the real password and emails the confirmation link.
        $supabaseId = $supabase->signUp($request->email, $request->password, $request->name);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Str::random(40),
        ]);

        $user->forceFill(['supabase_id' => $supabaseId, 'is_vendor' => $request->account_type === 'vendor'])->save();

        Auth::login($user);

        return to_route('dashboard');
    }
}
