<?php

namespace App\Http\Controllers;

use App\Enums\QuoteStatus;
use App\Enums\VendorStatus;
use App\Models\Quote;
use App\Models\RecommendedVendor;
use App\Models\User;
use App\Models\VendorReview;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VendorReviewController extends Controller
{
    /**
     * Create or replace the signed in user's review. One review per user per vendor.
     */
    public function store(Request $request, RecommendedVendor $vendor): RedirectResponse
    {
        abort_if($request->user()->is_admin || $request->user()->is_vendor, 403, 'Admins and vendors cannot review vendors.');
        abort_unless($vendor->status === VendorStatus::Approved, 404);

        $data = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $vendor->reviews()->updateOrCreate(['user_id' => $request->user()->id], $data);

        return back()->with('success', 'Review saved.');
    }

    public function destroy(Request $request, RecommendedVendor $vendor): RedirectResponse
    {
        $vendor->reviews()->where('user_id', $request->user()->id)->delete();

        return back()->with('success', 'Review deleted.');
    }

    /**
     * Review any vendor the user chose for one of their events, by name.
     * A name that matches a recommended vendor goes to that vendor's reviews.
     */
    public function storeByName(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_if($user->is_admin || $user->is_vendor, 403, 'Admins and vendors cannot review vendors.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'rating' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $key = VendorReview::keyFor($data['name']);
        abort_unless($this->hasChosen($user, $key), 403, 'You can only review vendors you chose for one of your events.');

        $values = ['rating' => $data['rating'], 'comment' => $data['comment'] ?? null];

        if ($recommended = $this->recommendedNamed($key)) {
            $recommended->reviews()->updateOrCreate(['user_id' => $user->id], $values);
        } else {
            VendorReview::updateOrCreate(['vendor_name' => $key, 'user_id' => $user->id], $values);
        }

        return back()->with('success', 'Review saved.');
    }

    public function destroyByName(Request $request): RedirectResponse
    {
        $key = VendorReview::keyFor($request->validate(['name' => ['required', 'string', 'max:255']])['name']);
        $recommended = $this->recommendedNamed($key);

        VendorReview::query()
            ->where('user_id', $request->user()->id)
            ->where(fn($query) => $recommended
                ? $query->where('recommended_vendor_id', $recommended->id)
                : $query->where('vendor_name', $key))
            ->delete();

        return back()->with('success', 'Review deleted.');
    }

    private function hasChosen(User $user, string $key): bool
    {
        return Quote::query()
            ->where('status', QuoteStatus::Accepted->value)
            ->whereRaw('lower(trim(vendor_name)) = ?', [$key])
            ->whereHas('vendorNeed.event', fn($events) => $events->whereBelongsTo($user))
            ->exists();
    }

    private function recommendedNamed(string $key): ?RecommendedVendor
    {
        return RecommendedVendor::query()->approved()->where(DB::raw('lower(name)'), $key)->first();
    }
}
