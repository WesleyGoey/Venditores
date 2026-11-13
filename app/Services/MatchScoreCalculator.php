<?php

namespace App\Services;

/**
 * Combines the AI specification score with a price score.
 *
 * The cheaper the offer, the better the budget score, also inside the budget.
 */
class MatchScoreCalculator
{
    private const SPEC_WEIGHT = 0.6;

    private const BUDGET_WEIGHT = 0.4;

    /**
     * Score of an offer that costs exactly the allocated budget.
     * Free scores 100, the full budget scores this, and going over drops faster.
     */
    private const SCORE_AT_BUDGET = 70;

    private const PENALTY_PER_PERCENT_OVER = 2;

    /**
     * @return array{spec_score: int, budget_score: int, match_score: int}
     */
    public function calculate(int $specScore, int $price, int $allocatedBudget): array
    {
        $specScore = $this->clamp($specScore);
        $budgetScore = $this->budgetScore($price, $allocatedBudget);

        return [
            'spec_score' => $specScore,
            'budget_score' => $budgetScore,
            'match_score' => $this->clamp((int) round(
                self::SPEC_WEIGHT * $specScore + self::BUDGET_WEIGHT * $budgetScore,
            )),
        ];
    }

    /**
     * 100 when free, 70 at exactly the budget, then minus 2 points per percent over it.
     */
    public function budgetScore(int $price, int $allocatedBudget): int
    {
        if ($allocatedBudget <= 0) {
            return $price <= 0 ? 100 : 0;
        }

        if ($price <= $allocatedBudget) {
            $share = $price / $allocatedBudget;

            return $this->clamp((int) round(100 - (100 - self::SCORE_AT_BUDGET) * $share));
        }

        $percentOver = ($price - $allocatedBudget) / $allocatedBudget * 100;

        return $this->clamp((int) round(self::SCORE_AT_BUDGET - self::PENALTY_PER_PERCENT_OVER * $percentOver));
    }

    private function clamp(int $score): int
    {
        return max(0, min(100, $score));
    }
}
