<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\SupabaseAuth;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Show the password reset link request page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Ask Supabase to email a password reset link.
     *
     * @throws ValidationException
     */
    public function store(Request $request, SupabaseAuth $supabase): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $supabase->sendPasswordReset($request->email);

        return back()->with('status', __('A reset link will be sent if the account exists.'));
    }
}
