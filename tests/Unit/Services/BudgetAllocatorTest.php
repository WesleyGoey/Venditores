<?php

use App\Services\BudgetAllocator;

test('amounts always add up to the total budget', function (int $totalBudget, array $percentages) {
    $allocations = (new BudgetAllocator)->allocate($totalBudget, $percentages);

    expect(array_sum(array_column($allocations, 'amount')))->toBe($totalBudget)
        ->and(array_sum(array_column($allocations, 'basis_points')))->toBe(10_000);
})->with([
    'clean split' => [100_000_000, [50, 30, 20]],
    'thirds' => [100_000_000, [33.33, 33.33, 33.34]],
    'percentages not summing to 100' => [75_000_001, [40, 40, 40]],
    'odd budget' => [999_999_999, [12.5, 7.25, 30, 50.25]],
]);

test('it splits the budget proportionally to the percentages', function () {
    $allocations = (new BudgetAllocator)->allocate(200_000_000, [50, 30, 20]);

    expect($allocations)->toBe([
        ['basis_points' => 5_000, 'amount' => 100_000_000],
        ['basis_points' => 3_000, 'amount' => 60_000_000],
        ['basis_points' => 2_000, 'amount' => 40_000_000],
    ]);
});

test('leftover rupiah goes to the largest remainders first', function () {
    $allocations = (new BudgetAllocator)->allocate(10, [1, 1, 1]);

    expect(array_column($allocations, 'basis_points'))->toBe([3_334, 3_333, 3_333])
        ->and(array_column($allocations, 'amount'))->toBe([4, 3, 3]);
});

test('it splits evenly when every percentage is zero or negative', function () {
    $allocations = (new BudgetAllocator)->allocate(90, [0, -5, 0]);

    expect(array_column($allocations, 'amount'))->toBe([30, 30, 30]);
});

test('it returns no allocations for no needs', function () {
    expect((new BudgetAllocator)->allocate(1_000_000, []))->toBe([]);
});
