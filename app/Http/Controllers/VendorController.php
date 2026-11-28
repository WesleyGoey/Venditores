<?php

namespace App\Http\Controllers;

use App\Enums\VendorStatus;
use App\Http\Requests\RecommendedVendorRequest;
use App\Models\Quote;
use App\Models\RecommendedVendor;
use App\Models\User;
use App\Models\VendorReview;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Vendors recommended by the admin. Users read and review the approved ones, the admin approves what vendor
 * accounts list, and a vendor account sees its own vendors with their reviews.
 */
class VendorController extends Controller
{
    private const REVIEWS_SHOWN = 20;

    private const USER_VENDORS_SHOWN = 100;

    public function index(Request $request): Response
    {
        $user = $request->user();

        if ($user->is_vendor) {
            return $this->ownVendors($user);
        }

        $vendors = $this->withReviews(RecommendedVendor::query()->approved())
            ->when($user->is_admin, fn(Builder $query) => $query->with('owner:id,name'))
            ->orderByRaw('lower(category)')
            ->orderBy('name')
            ->get()
            ->map(fn(RecommendedVendor $vendor): array => [
                ...$this->reviewedRow($vendor, $user),
                // Only the admin needs to tell its own vendors from the ones a vendor account manages.
                'owner' => $user->is_admin ? $vendor->owner?->name : null,
            ]);

        return Inertia::render('vendors/index', [
            'vendors' => $vendors,
            'userVendors' => $user->is_admin ? $this->userVendors() : null,
            'pendingVendors' => $user->is_admin ? $this->pendingVendors() : null,
        ]);
    }

    /**
     * The admin approves or rejects a vendor a vendor account listed. A rejection needs a reason the owner can read.
     */
    public function review(Request $request, RecommendedVendor $vendor): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in([VendorStatus::Approved->value, VendorStatus::Rejected->value])],
            'admin_note' => ['nullable', 'required_if:status,rejected', 'string', 'max:500'],
        ]);

        $vendor->forceFill([
            'status' => $data['status'],
            'admin_note' => $data['status'] === VendorStatus::Rejected->value ? $data['admin_note'] : null,
        ])->save();

        return back()->with('success', $data['status'] === VendorStatus::Approved->value ? 'Vendor approved. Users see it now.' : 'Vendor rejected. The owner sees your note.');
    }

    /**
     * The admin hands a vendor to a vendor account, so its owner can read the reviews and edit it. An empty email
     * takes the owner away again. The vendor account asks the admin outside the app, which is the proof of ownership.
     */
    public function assignOwner(Request $request, RecommendedVendor $vendor): RedirectResponse
    {
        $email = mb_strtolower(trim((string) $request->validate(['email' => ['nullable', 'string', 'email', 'max:255']])['email']));

        if ($email === '') {
            $vendor->forceFill(['user_id' => null])->save();

            return back()->with('success', 'The vendor is managed by the admin again.');
        }

        $owner = User::query()->where('email', $email)->where('is_vendor', true)->first();

        if ($owner === null) {
            throw ValidationException::withMessages(['email' => 'No vendor account has this email.']);
        }

        $vendor->forceFill(['user_id' => $owner->id])->save();

        return back()->with('success', "The vendor now belongs to {$owner->name}.");
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
     * Rating, review count and the latest reviews with their authors, loaded in the same query as the vendors.
     *
     * @param  Builder<RecommendedVendor>  $query
     * @return Builder<RecommendedVendor>
     */
    private function withReviews(Builder $query): Builder
    {
        return $query
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->with(['reviews' => fn($reviews) => $reviews
                ->with('user:id,name')
                ->latest()
                ->limit(self::REVIEWS_SHOWN)]);
    }

    /**
     * A vendor with its rating, its reviews and the viewer's own review.
     *
     * @return array<string, mixed>
     */
    private function reviewedRow(RecommendedVendor $vendor, User $viewer): array
    {
        return [
            ...$vendor->only(['id', 'name', 'category', 'description', 'contact', 'website', 'price_estimate']),
            'rating' => $vendor->reviews_avg_rating !== null ? round((float) $vendor->reviews_avg_rating, 1) : null,
            'reviews_count' => $vendor->reviews_count,
            'my_review' => $vendor->reviews
                ->firstWhere('user_id', $viewer->id)
                ?->only(['rating', 'comment']),
            'reviews' => $vendor->reviews->map(fn($review): array => [
                'id' => $review->id,
                'user' => $review->user->name,
                'rating' => $review->rating,
                'comment' => $review->comment,
                'created_at' => $review->created_at->toDateString(),
            ])->values(),
        ];
    }

    /**
     * Vendors that users entered themselves (as quotes), newest first.
     * Only the admin sees them, apart from the recommended list.
     */
    private function userVendors(): array
    {
        $quotes = Quote::query()
            ->with('vendorNeed.event.user:id,name')
            ->latest()
            ->limit(self::USER_VENDORS_SHOWN)
            ->get();

        $reviews = VendorReview::summariesFor($quotes->pluck('vendor_name'));

        return $quotes
            ->map(fn(Quote $quote): array => [
                'rating' => $reviews[VendorReview::keyFor($quote->vendor_name)]['rating'] ?? null,
                'reviews_count' => $reviews[VendorReview::keyFor($quote->vendor_name)]['reviews_count'] ?? 0,
                'id' => $quote->id,
                'name' => $quote->vendor_name,
                'contact' => $quote->vendor_contact,
                'notes' => $quote->notes,
                'price' => $quote->price,
                'category' => $quote->vendorNeed->category,
                'event' => $quote->vendorNeed->event->name,
                'user' => $quote->vendorNeed->event->user->name,
                'status' => $quote->status,
            ])
            ->all();
    }

    /**
     * Vendors waiting for the admin, oldest first, with who listed them and whether the name is already recommended.
     */
    private function pendingVendors(): array
    {
        $listed = RecommendedVendor::query()->approved()->pluck('name')
            ->mapWithKeys(fn(string $name): array => [VendorReview::keyFor($name) => true]);

        return RecommendedVendor::query()
            ->with('owner:id,name,email')
            ->where('status', VendorStatus::Pending->value)
            ->oldest()
            ->get()
            ->map(fn(RecommendedVendor $vendor): array => [
                ...$vendor->only(['id', 'name', 'category', 'description', 'contact', 'website', 'price_estimate']),
                'owner' => $vendor->owner?->name,
                'owner_email' => $vendor->owner?->email,
                'listed_at' => $vendor->created_at->toDateString(),
                'already_listed' => $listed->has(VendorReview::keyFor($vendor->name)),
            ])
            ->all();
    }

    /**
     * What a vendor account sees: its own vendors, whatever their status, with the reviews written for each one.
     * Reviews are matched by vendor id, never by name, so a vendor with a copied name cannot read another vendor's reviews.
     */
    private function ownVendors(User $user): Response
    {
        $vendors = $this->withReviews($user->ownedVendors()->getQuery())->latest()->get();

        return Inertia::render('vendors/mine', [
            'vendors' => $vendors->map(fn(RecommendedVendor $vendor): array => [
                ...$this->reviewedRow($vendor, $user),
                ...$vendor->only(['status', 'admin_note']),
                'my_review' => null,
            ])->all(),
        ]);
    }
}
