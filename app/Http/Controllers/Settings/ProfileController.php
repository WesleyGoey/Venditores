<?php


namespace App\Http\Controllers\Settings;


use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Services\SupabaseAuth;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;


class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     *
     * The link that confirms an email change comes back here, so pick up the new email from Supabase.
     */
    public function edit(Request $request, SupabaseAuth $supabase): Response
    {
        $user = $request->user();


        if ($user->supabase_id !== null) {
            $email = $supabase->user($user->supabase_id)['email'] ?? null;


            if ($email !== null && $email !== $user->email) {
                $user->update(['email' => $email]);
            }
        }


        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }


    /**
     * Update the user's name. A new email goes to Supabase, which changes it once the user confirms it.
     */
    public function update(ProfileUpdateRequest $request, SupabaseAuth $supabase): RedirectResponse
    {
        $user = $request->user();
        $user->fill($request->validated());
        $status = null;


        if ($user->isDirty('email')) {
            $supabase->changeEmail($user->email);
            $user->email = $user->getOriginal('email');
            $status = 'email-change-sent';
        }


        $user->save();


        return to_route('profile.edit')->with('status', $status);
    }


    /**
     * Delete the user's account here and in Supabase Auth.
     */
    public function destroy(Request $request, SupabaseAuth $supabase): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'string', PasswordController::currentPassword($request)],
        ]);


        $user = $request->user();


        if ($user->supabase_id !== null) {
            $supabase->deleteUser($user->supabase_id);
        }


        Auth::logout();


        $user->delete();


        $request->session()->invalidate();
        $request->session()->regenerateToken();


        return redirect('/');
    }
}
