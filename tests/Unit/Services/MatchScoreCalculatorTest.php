<?php

use App\Services\MatchScoreCalculator;

test('budget score is 100 when the price is within the allocation', function (int $price) {
    expect((new MatchScoreCalculator)->budgetScore($price, 10_000_000))->toBe(100);
})->with([0, 9_999_999, 10_000_000]);

test('budget score drops 2 points per percent over budget', function (int $price, int $expectedScore) {
    expect((new MatchScoreCalculator)->budgetScore($price, 10_000_000))->toBe($expectedScore);
})->with([
    '1% over' => [10_100_000, 98],
    '10% over' => [11_000_000, 80],
    '25% over' => [12_500_000, 50],
    '50% over' => [15_000_000, 0],
    '80% over' => [18_000_000, 0],
]);

test('budget score is 0 when nothing is allocated but the quote costs money', function () {
    expect((new MatchScoreCalculator)->budgetScore(1, 0))->toBe(0);
});

test('match score weighs spec 60 percent and budget 40 percent', function () {
    expect((new MatchScoreCalculator)->calculate(70, 11_000_000, 10_000_000))->toBe([
        'spec_score' => 70,
        'budget_score' => 80,
        'match_score' => 74,
    ]);
});

test('spec scores outside 0 to 100 are clamped', function () {
    $calculator = new MatchScoreCalculator;

    expect($calculator->calculate(150, 1, 1)['spec_score'])->toBe(100)
        ->and($calculator->calculate(-10, 1, 1)['spec_score'])->toBe(0);
});