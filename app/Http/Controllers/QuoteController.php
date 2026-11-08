<?php


namespace App\Http\Controllers;


use App\Enums\ProcurementStatus;
use App\Enums\QuoteStatus;
use App\Http\Requests\StoreQuoteRequest;
use App\Http\Requests\UpdateQuoteRequest;
use App\Models\Event;
use App\Models\Quote;
use App\Models\VendorNeed;
use App\Services\MatchScoreCalculator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;


class QuoteController extends Controller
{
    public function __construct(private MatchScoreCalculator $calculator) {}


    /**
     * Store a vendor quote for the need.
     */
    public function store(StoreQuoteRequest $request, Event $event, VendorNeed $vendorNeed): RedirectResponse
    {
        $vendorNeed->quotes()->create($request->validated());


        if (in_array($vendorNeed->procurement_status, [ProcurementStatus::Drafting, ProcurementStatus::Searching], true)) {
            $vendorNeed->update(['procurement_status' => ProcurementStatus::Quoted]);
        }


        return back()->with('success', 'Quote added.');
    }


    /**
     * Update a vendor quote.
     */
    public function update(UpdateQuoteRequest $request, Event $event, VendorNeed $vendorNeed, Quote $quote): RedirectResponse
    {
        $quote->fill($request->validated());


        if ($quote->isDirty('price') && $quote->spec_score !== null) {
            $quote->fill($this->calculator->calculate($quote->spec_score, $quote->price, $vendorNeed->allocated_budget));
        }


        $quote->save();


        if ($quote->wasChanged('status') && $quote->status === QuoteStatus::Accepted && ! $vendorNeed->procurement_status->isSecured()) {
            $vendorNeed->update(['procurement_status' => ProcurementStatus::Deal]);
        }


        return back()->with('success', 'Quote updated.');
    }


    /**
     * Delete a vendor quote.
     */
    public function destroy(Event $event, VendorNeed $vendorNeed, Quote $quote): RedirectResponse
    {
        Gate::authorize('update', $event);


        $quote->delete();


        return back()->with('success', 'Quote deleted.');
    }
}
