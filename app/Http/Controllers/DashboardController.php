<?php

namespace App\Http\Controllers;

use App\Enums\EventStatus;
use App\Enums\ProcurementStatus;
use App\Enums\RiskLevel;
use App\Models\Event;
use App\Models\Quote;
use App\Models\VendorNeed;
use App\Services\RiskMonitor;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Number of critical needs shown on the dashboard.
     */
    private const CRITICAL_NEEDS_LIMIT = 10;

    /**
     * Show the procurement overview for the signed-in user.
     */
    public function __invoke(Request $request, RiskMonitor $riskMonitor): Response
    {
        $user = $request->user();

        $ownNeeds = fn (): Builder => VendorNeed::query()
            ->whereHas('event', fn (Builder $events) => $events->whereBelongsTo($user));

        $eventStatusCounts = $user->events()
            ->toBase()
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $procurementStatusCounts = $ownNeeds()
            ->toBase()
            ->selectRaw('procurement_status, count(*) as aggregate')
            ->groupBy('procurement_status')
            ->pluck('aggregate', 'procurement_status');

        $criticalNeeds = $ownNeeds()
            ->critical()
            ->whereHas('event', fn (Builder $events) => $events->where('status', '!=', EventStatus::Completed->value))
            ->with('event:id,name,event_date')
            ->orderByDesc('is_vital')
            ->orderByDesc('allocated_budget')
            ->limit(self::CRITICAL_NEEDS_LIMIT)
            ->get()
            ->map(fn (VendorNeed $need): array => [
                'id' => $need->id,
                'category' => $need->category,
                'is_vital' => $need->is_vital,
                'allocated_budget' => $need->allocated_budget,
                'procurement_status' => $need->procurement_status,
                'event' => [
                    'id' => $need->event->id,
                    'name' => $need->event->name,
                    'event_date' => $need->event->event_date->toDateString(),
                ],
            ]);

        $warnings = $user->events()
            ->where('status', EventStatus::Analyzed->value)
            ->with('vendorNeeds')
            ->get()
            ->map(fn (Event $event): array => [
                'event' => [
                    'id' => $event->id,
                    'name' => $event->name,
                    'event_date' => $event->event_date->toDateString(),
                ],
                ...$riskMonitor->assess($event),
            ])
            ->reject(fn (array $warning): bool => $warning['level'] === RiskLevel::Low)
            ->sortBy('days_remaining')
            ->values();

        return Inertia::render('dashboard', [
            'stats' => [
                'events' => $user->events()->count(),
                'vendor_needs' => $ownNeeds()->count(),
                'quotes' => Quote::query()
                    ->whereHas('vendorNeed.event', fn (Builder $events) => $events->whereBelongsTo($user))
                    ->count(),
                'total_budget' => (int) $user->events()->sum('total_budget'),
            ],
            'eventStatusCounts' => collect(EventStatus::cases())->map(fn (EventStatus $status): array => [
                'value' => $status->value,
                'label' => $status->label(),
                'count' => (int) ($eventStatusCounts[$status->value] ?? 0),
            ]),
            'procurementStatusCounts' => collect(ProcurementStatus::cases())->map(fn (ProcurementStatus $status): array => [
                'value' => $status->value,
                'label' => $status->label(),
                'count' => (int) ($procurementStatusCounts[$status->value] ?? 0),
            ]),
            'criticalNeeds' => $criticalNeeds,
            'warnings' => $warnings,
        ]);
    }
}
