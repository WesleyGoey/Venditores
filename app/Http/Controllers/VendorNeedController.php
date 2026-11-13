<?php

namespace App\Http\Controllers;

use App\Enums\ProcurementStatus;
use App\Enums\QuoteStatus;
use App\Http\Requests\StoreVendorNeedRequest;
use App\Http\Requests\UpdateVendorNeedRequest;
use App\Models\Event;
use App\Models\RecommendedVendor;
use App\Models\VendorNeed;
use App\Services\VendorHistory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class VendorNeedController extends Controller
{
    /**
     * Display a vendor need with its quotes.
     */
    public function show(Request $request, Event $event, VendorNeed $vendorNeed, VendorHistory $history): Response
    {
        Gate::authorize('view', $event);

        $vendorNeed->load(['quotes' => fn ($query) => $query
            ->orderByRaw('match_score is null')
            ->orderByDesc('match_score')
            ->orderBy('price'),
        ]);

        return Inertia::render('vendor-needs/show', [
            'event' => [
                ...$event->only(['id', 'name', 'location', 'total_budget', 'status']),
                'event_date' => $event->event_date->toDateString(),
            ],
            'vendorNeed' => $vendorNeed,
            'recommendedVendors' => RecommendedVendor::query()
                ->withAvg('reviews', 'rating')
                ->withCount('reviews')
                ->orderByRaw('lower(category)')
                ->orderBy('name')
                ->get()
                ->map(fn (RecommendedVendor $vendor): array => [
                    ...$vendor->only(['id', 'name', 'category', 'description', 'contact', 'website', 'price_estimate']),
                    'rating' => $vendor->reviews_avg_rating !== null ? round((float) $vendor->reviews_avg_rating, 1) : null,
                    'reviews_count' => $vendor->reviews_count,
                    'matches_need' => $vendor->matchesCategory($vendorNeed->category),
                ]),
            'usedVendors' => $history->vendorsUsedBy($request->user(), $vendorNeed->id),
            'procurementStatuses' => array_map(
                fn (ProcurementStatus $status): array => ['value' => $status->value, 'label' => $status->label()],
                ProcurementStatus::cases(),
            ),
            'quoteStatuses' => array_map(
                fn (QuoteStatus $status): array => ['value' => $status->value, 'label' => $status->label()],
                QuoteStatus::cases(),
            ),
        ]);
    }

    /**
     * Store a manually added vendor need.
     */
    public function store(StoreVendorNeedRequest $request, Event $event): RedirectResponse
    {
        $event->vendorNeeds()->create($request->validated());

        return back()->with('success', 'Vendor need added.');
    }

    /**
     * Update a vendor need.
     */
    public function update(UpdateVendorNeedRequest $request, Event $event, VendorNeed $vendorNeed): RedirectResponse
    {
        $vendorNeed->fill($request->validated());

        if ($vendorNeed->isDirty('allocated_budget')) {
            $vendorNeed->allocation_basis_points = null;
        }

        $vendorNeed->save();

        return back()->with('success', 'Vendor need updated.');
    }

    /**
     * Delete a vendor need and its quotes.
     */
    public function destroy(Event $event, VendorNeed $vendorNeed): RedirectResponse
    {
        Gate::authorize('update', $event);

        $vendorNeed->delete();

        return to_route('events.show', $event)->with('success', 'Vendor need deleted.');
    }
}
