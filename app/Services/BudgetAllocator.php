<?php

namespace App\Services;

class BudgetAllocator
{
    /**
     * Total number of basis points in a whole budget (100.00%).
     */
    public const TOTAL_BASIS_POINTS = 10_000;

    /**
     * Split a total Rupiah budget across weighted needs.
     *
     * Percentages are first normalised into basis points that sum to exactly
     * 10,000, and the budget is then split by those basis points. Both steps
     * use the largest remainder method, so the amounts are whole Rupiah and
     * always add up to the total budget.
     *
     * @param  list<float|int>  $percentages
     * @return list<array{basis_points: int, amount: int}>
     */
    public function allocate(int $totalBudget, array $percentages): array
    {
        if ($percentages === []) {
            return [];
        }

        $weights = array_map(fn (float|int $percentage): float => max(0.0, (float) $percentage), $percentages);

        if (array_sum($weights) <= 0) {
            $weights = array_fill(0, count($weights), 1.0);
        }

        $basisPoints = $this->largestRemainder($weights, self::TOTAL_BASIS_POINTS);
        $amounts = $this->splitByBasisPoints(max(0, $totalBudget), $basisPoints);

        return array_map(
            fn (int $points, int $amount): array => ['basis_points' => $points, 'amount' => $amount],
            $basisPoints,
            $amounts,
        );
    }

    /**
     * Distribute an integer target proportionally to float weights.
     *
     * @param  list<float>  $weights
     * @return list<int>
     */
    private function largestRemainder(array $weights, int $target): array
    {
        $weightTotal = array_sum($weights);
        $shares = [];
        $remainders = [];

        foreach ($weights as $index => $weight) {
            $exact = $weight / $weightTotal * $target;
            $shares[$index] = (int) floor($exact);
            $remainders[$index] = $exact - $shares[$index];
        }

        return $this->distributeLeftover($shares, $remainders, $target);
    }

    /**
     * Split a Rupiah amount by basis points using exact integer arithmetic.
     *
     * @param  list<int>  $basisPoints
     * @return list<int>
     */
    private function splitByBasisPoints(int $totalBudget, array $basisPoints): array
    {
        $shares = [];
        $remainders = [];

        foreach ($basisPoints as $index => $points) {
            $product = $totalBudget * $points;
            $shares[$index] = intdiv($product, self::TOTAL_BASIS_POINTS);
            $remainders[$index] = $product % self::TOTAL_BASIS_POINTS;
        }

        return $this->distributeLeftover($shares, $remainders, $totalBudget);
    }

    /**
     * Hand out the units lost to flooring, largest remainder first.
     *
     * @param  array<int, int>  $shares
     * @param  array<int, float|int>  $remainders
     * @return list<int>
     */
    private function distributeLeftover(array $shares, array $remainders, int $target): array
    {
        $leftover = $target - array_sum($shares);

        $order = array_keys($remainders);
        usort($order, fn (int $a, int $b): int => [$remainders[$b], $a] <=> [$remainders[$a], $b]);

        foreach (array_slice($order, 0, $leftover) as $index) {
            $shares[$index]++;
        }

        return array_values($shares);
    }
}
