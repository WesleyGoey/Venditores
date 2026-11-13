<?php

namespace App\Http\Controllers;

use App\Http\Requests\RecommendedVendorRequest;
use App\Models\Quote;
use App\Models\RecommendedVendor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Vendors recommended by the admin. Everyone can read and review them,
 * only the admin can change the list.
 */
class VendorController extends Controller
{
    private const REVIEWS_SHOWN = 20;

    private const USER_VENDORS_SHOWN = 100;

    public function index(Request $request): Response
    {
        $user = $request->user();

        $vendors = RecommendedVendor::query()
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->with(['reviews' => fn ($reviews) => $reviews
                ->with('user:id,name')
                ->latest()
                ->limit(self::REVIEWS_SHOWN)])
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->map(fn (RecommendedVendor $vendor): array => [
                ...$vendor->only(['id', 'name', 'category', 'description', 'contact', 'website', 'price_estimate']),
                'rating' => $vendor->reviews_avg_rating !== null ? round((float) $vendor->reviews_avg_rating, 1) : null,
                'reviews_count' => $vendor->reviews_count,
                'my_review' => $vendor->reviews
                    ->firstWhere('user_id', $user->id)
                    ?->only(['rating', 'comment']),
                'reviews' => $vendor->reviews->map(fn ($review): array => [
                    'id' => $review->id,
                    'user' => $review->user->name,
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'created_at' => $review->created_at->toDateString(),
                ])->values(),
            ]);

        return Inertia::render('vendors/index', [
            'vendors' => $vendors,
            'userVendors' => $user->is_admin ? $this->userVendors() : null,
        ]);
    }

    public function store(RecommendedVendorRequest $request): RedirectResponse
    {
        RecommendedVendor::create($request->validated());

        return back()->with('success', 'Vendor added.');
    }

    public function update(RecommendedVendorRequest $request, RecommendedVendor $vendor): RedirectResponse
    {
        $vendor->update($request->validated());

        return back()->with('success', 'Vendor updated.');
    }

    public function destroy(RecommendedVendor $vendor): RedirectResponse
    {
        $vendor->delete();

        return back()->with('success', 'Vendor deleted.');
    }

    /**
     * Vendors that users entered themselves (as quotes), newest first.
     * Only the admin sees them, apart from the recommended list.
     */
    private function userVendors(): array
    {
        return Quote::query()
            ->with('vendorNeed.event.user:id,name')
            ->latest()
            ->limit(self::USER_VENDORS_SHOWN)
            ->get()
            ->map(fn (Quote $quote): array => [
                'id' => $quote->id,
                'name' => $quote->vendor_name,
                'contact' => $quote->vendor_contact,
                'price' => $quote->price,
                'category' => $quote->vendorNeed->category,
                'event' => $quote->vendorNeed->event->name,
                'user' => $quote->vendorNeed->event->user->name,
                'status' => $quote->status,
            ])
            ->all();
    }
}
