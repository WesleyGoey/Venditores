<?php

namespace App\Services;

use App\Enums\RiskLevel;
use App\Models\Event;
use App\Models\VendorNeed;
use Carbon\CarbonInterface;

class RiskMonitor
{
    public const URGENT_WITHIN_DAYS = 30;

    public const WARNING_WITHIN_DAYS = 60;

    public function levelForDaysRemaining(int $daysRemaining): RiskLevel
    {
        return match (true) {
            $daysRemaining <= self::URGENT_WITHIN_DAYS => RiskLevel::Urgent,
            $daysRemaining <= self::WARNING_WITHIN_DAYS => RiskLevel::Warning,
            default => RiskLevel::Low,
        };
    }

    public function daysRemaining(CarbonInterface $eventDate, CarbonInterface $today): int
    {
        return (int) $today->copy()->startOfDay()->diffInDays($eventDate->copy()->startOfDay(), false);
    }

    /**
     * Assess an event's deadline risk and the needs that are still open.
     *
     * Expects the event's vendor needs to be loaded or loadable.
     *
     * @return array{level: RiskLevel, days_remaining: int, unsecured_needs: int, unsecured_vital_needs: list<string>}
     */
    public function assess(Event $event, ?CarbonInterface $today = null): array
    {
        $daysRemaining = $this->daysRemaining($event->event_date, $today ?? now());

        $unsecuredNeeds = $event->vendorNeeds
            ->reject(fn (VendorNeed $need): bool => $need->procurement_status->isSecured());

        return [
            'level' => $this->levelForDaysRemaining($daysRemaining),
            'days_remaining' => $daysRemaining,
            'unsecured_needs' => $unsecuredNeeds->count(),
            'unsecured_vital_needs' => $unsecuredNeeds
                ->filter(fn (VendorNeed $need): bool => $need->is_vital)
                ->pluck('category')
                ->values()
                ->all(),
        ];
    }
}
