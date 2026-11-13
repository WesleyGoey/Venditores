<?php

use App\Enums\RiskLevel;
use App\Services\RiskMonitor;
use Carbon\CarbonImmutable;

test('risk level follows the days remaining', function (int $days, RiskLevel $expected) {
    expect((new RiskMonitor)->levelForDaysRemaining($days))->toBe($expected);
})->with([
    'past event' => [-3, RiskLevel::Urgent],
    'today' => [0, RiskLevel::Urgent],
    '30 days' => [30, RiskLevel::Urgent],
    '31 days' => [31, RiskLevel::Warning],
    '60 days' => [60, RiskLevel::Warning],
    '61 days' => [61, RiskLevel::Low],
]);

test('days remaining counts whole calendar days', function () {
    $monitor = new RiskMonitor;
    $today = CarbonImmutable::parse('2026-11-06 23:59:00');

    expect($monitor->daysRemaining(CarbonImmutable::parse('2026-12-06'), $today))->toBe(30)
        ->and($monitor->daysRemaining(CarbonImmutable::parse('2026-11-01'), $today))->toBe(-5);
});
