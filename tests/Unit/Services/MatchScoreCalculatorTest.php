<?php

use App\Services\MatchScoreCalculator;

test('a cheaper offer scores higher, also inside the budget', function (int $price, int $expectedScore) {
    expect((new MatchScoreCalculator)->budgetScore($price, 10_000_000))->toBe($expectedScore);
})->with([
    'free' => [0, 100],
    '50% of budget' => [5_000_000, 85],
    '90% of budget' => [9_000_000, 73],
    'exactly the budget' => [10_000_000, 70],
]);

test('budget score drops 2 points per percent over budget', function (int $price, int $expectedScore) {
    expect((new MatchScoreCalculator)->budgetScore($price, 10_000_000))->toBe($expectedScore);
})->with([
    '1% over' => [10_100_000, 68],
    '10% over' => [11_000_000, 50],
    '35% over' => [13_500_000, 0],
    '80% over' => [18_000_000, 0],
]);

test('a cheaper offer never scores lower than a pricier one', function () {
    $calculator = new MatchScoreCalculator;
    $scores = array_map(fn (int $price): int => $calculator->budgetScore($price, 10_000_000), range(0, 20_000_000, 500_000));

    $sorted = $scores;
    rsort($sorted);

    expect($scores)->toBe($sorted);
});

test('with nothing allocated only a free quote scores', function () {
    $calculator = new MatchScoreCalculator;

    expect($calculator->budgetScore(1, 0))->toBe(0)
        ->and($calculator->budgetScore(0, 0))->toBe(100);
});

test('match score weighs spec 60 percent and budget 40 percent', function () {
    expect((new MatchScoreCalculator)->calculate(70, 11_000_000, 10_000_000))->toBe([
        'spec_score' => 70,
        'budget_score' => 50,
        'match_score' => 62,
    ]);
});

test('spec scores outside 0 to 100 are clamped', function () {
    $calculator = new MatchScoreCalculator;

    expect($calculator->calculate(150, 1, 1)['spec_score'])->toBe(100)
        ->and($calculator->calculate(-10, 1, 1)['spec_score'])->toBe(0);
});
