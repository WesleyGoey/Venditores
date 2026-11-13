<?php

namespace App\Http\Controllers;

use App\Enums\QuoteStatus;
use App\Models\Event;
use App\Models\VendorNeed;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Every event of the user with the vendors that were chosen for it.
 */
class HistoryController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $events = $request->user()->events()
            ->with(['vendorNeeds' => fn ($needs) => $needs
                ->with(['quotes' => fn ($quotes) => $quotes->where('status', QuoteStatus::Accepted->value)])
                ->orderBy('category')])
            ->orderByDesc('event_date')
            ->get()
            ->map(fn (Event $event): array => [
                'id' => $event->id,
                'name' => $event->name,
                'event_date' => $event->event_date->toDateString(),
                'location' => $event->location,
                'status' => $event->status,
                'vendors' => $event->vendorNeeds
                    ->filter(fn (VendorNeed $need): bool => $need->quotes->isNotEmpty())
                    ->map(fn (VendorNeed $need): array => [
                        'need_id' => $need->id,
                        'category' => $need->category,
                        'name' => $need->quotes->first()->vendor_name,
                        'contact' => $need->quotes->first()->vendor_contact,
                        'price' => $need->quotes->first()->price,
                        'procurement_status' => $need->procurement_status,
                    ])
                    ->values(),
            ]);

        return Inertia::render('history/index', ['events' => $events]);
    }
}
