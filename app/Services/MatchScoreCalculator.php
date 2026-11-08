<?php

namespace App\Services;

class MatchScoreCalculator
{
    private const SPEC_WEIGHT = 0.6;

    private const BUDGET_WEIGHT = 0.4;

    /**
     * Points deducted for every 1% a quote goes over its allocation.
     */
    private const PENALTY_PER_PERCENT_OVER = 2;

    /**
     * Combine Gemini's specification score with the PHP budget score.
     *
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
     * Score 100 when within budget, minus 2 points per 1% over budget.
     */
    public function budgetScore(int $price, int $allocatedBudget): int
    {
        if ($price <= $allocatedBudget) {
            return 100;
        }

        if ($allocatedBudget <= 0) {
            return 0;
        }

        $percentOver = ($price - $allocatedBudget) / $allocatedBudget * 100;

        return $this->clamp((int) round(100 - self::PENALTY_PER_PERCENT_OVER * $percentOver));
    }

    private function clamp(int $score): int
    {
        return max(0, min(100, $score));
    }
}