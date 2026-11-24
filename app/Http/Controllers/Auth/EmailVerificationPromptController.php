<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\SupabaseAuth;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationPromptController extends Controller
{
    /**
     * Show the email verification prompt page.
     *
     * The link in Supabase's confirmation email comes back here, so check
     * whether Supabase has confirmed the email in the meantime.
     */
    public function __invoke(Request $request, SupabaseAuth $supabase): Response|RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasVerifiedEmail() && $user->supabase_id !== null) {
            $confirmedAt = $supabase->user($user->supabase_id)['email_confirmed_at'] ?? null;

            if ($confirmedAt !== null) {
                $user->forceFill(['email_verified_at' => $confirmedAt])->save();
            }
        }

        return $user->hasVerifiedEmail()
                    ? redirect()->intended(route('dashboard', absolute: false))
                    : Inertia::render('auth/verify-email', ['status' => $request->session()->get('status')]);
    }
}
