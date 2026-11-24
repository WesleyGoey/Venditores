<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\SupabaseAuth;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class NewPasswordController extends Controller
{
    /**
     * Show the password reset page. The page reads Supabase's access token from the URL fragment.
     */
    public function create(): Response
    {
        return Inertia::render('auth/reset-password');
    }

    /**
     * Set the new password with the access token from the reset link.
     *
     * @throws ValidationException
     */
    public function store(Request $request, SupabaseAuth $supabase): RedirectResponse
    {
        $request->validate([
            'token' => 'required|string',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $supabase->resetPassword($request->token, $request->password);

        return to_route('login')->with('status', __('Your password has been reset.'));
    }
}
