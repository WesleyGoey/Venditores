<?php

namespace App\Services;

use App\Enums\QuoteStatus;
use App\Models\Quote;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * The vendors a user chose in earlier events (accepted quotes).
 */
class VendorHistory
{
    private const LIMIT = 100;

    /**
     * One row per vendor and category, newest use first, so it can be offered again as a quote.
     *
     * @return Collection<int, array{name: string, contact: ?string, price: int, notes: ?string, category: string, event: string, event_date: string}>
     */
    public function vendorsUsedBy(User $user, ?int $exceptVendorNeedId = null): Collection
    {
        return $this->acceptedQuotes($user)
            ->when($exceptVendorNeedId, fn ($query, int $id) => $query->where('vendor_need_id', '!=', $id))
            ->latest('quotes.id')
            ->limit(self::LIMIT * 3)
            ->get()
            ->unique(fn (Quote $quote): string => mb_strtolower($quote->vendor_name).'|'.mb_strtolower($quote->vendorNeed->category))
            ->take(self::LIMIT)
            ->map(fn (Quote $quote): array => [
                'name' => $quote->vendor_name,
                'contact' => $quote->vendor_contact,
                'price' => $quote->price,
                'notes' => $quote->notes,
                'category' => $quote->vendorNeed->category,
                'event' => $quote->vendorNeed->event->name,
                'event_date' => $quote->vendorNeed->event->event_date->toDateString(),
            ])
            ->values();
    }

    private function acceptedQuotes(User $user)
    {
        return Quote::query()
            ->with('vendorNeed.event')
            ->where('status', QuoteStatus::Accepted->value)
            ->whereHas('vendorNeed.event', fn ($events) => $events->whereBelongsTo($user));
    }
}
