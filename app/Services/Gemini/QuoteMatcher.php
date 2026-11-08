<?php

namespace App\Services\Gemini;

use App\Exceptions\GeminiException;
use App\Models\Quote;
use App\Models\VendorNeed;
use App\Services\MatchScoreCalculator;
use Illuminate\Support\Facades\DB;

class QuoteMatcher
{
    public function __construct(
        private GeminiClient $gemini,
        private MatchScoreCalculator $calculator,
    ) {}

    /**
     * Score every quote of a vendor need against its specification.
     *
     * Gemini only rates how well each quote fits the specification (0-100).
     * The budget score and the final weighted score are calculated in PHP.
     *
     * @throws GeminiException
     */
    public function match(VendorNeed $vendorNeed): void
    {
        $quotes = $vendorNeed->quotes()->get();

        if ($quotes->isEmpty()) {
            return;
        }

        $result = $this->gemini->generateJson(
            parts: [['text' => $this->prompt($vendorNeed, $quotes->all())]],
            responseSchema: $this->schema(),
            systemInstruction: 'You are an impartial procurement reviewer. You judge how well vendor quotes meet a technical specification. Ignore price; price is scored separately. Write reasons in the same language as the specification.',
        );

        $scores = collect($result['results'] ?? [])
            ->filter(fn (mixed $row): bool => is_array($row) && is_numeric($row['quote_id'] ?? null))
            ->keyBy(fn (array $row): int => (int) $row['quote_id']);

        if ($scores->isEmpty()) {
            throw GeminiException::unusableResult('no quote scores were returned.');
        }

        DB::transaction(function () use ($quotes, $scores, $vendorNeed): void {
            foreach ($quotes as $quote) {
                $score = $scores->get($quote->id);

                if ($score === null) {
                    continue;
                }

                $quote->update([
                    ...$this->calculator->calculate(
                        (int) round((float) ($score['spec_score'] ?? 0)),
                        $quote->price,
                        $vendorNeed->allocated_budget,
                    ),
                    'match_reason' => (string) ($score['reason'] ?? ''),
                    'matched_at' => now(),
                ]);
            }
        });
    }

    /**
     * @param  list<Quote>  $quotes
     */
    private function prompt(VendorNeed $vendorNeed, array $quotes): string
    {
        $quoteLines = collect($quotes)
            ->map(fn (Quote $quote): string => sprintf(
                "- quote_id: %d\n  vendor: %s\n  offer details: %s",
                $quote->id,
                $quote->vendor_name,
                $quote->notes ?: '(no details provided)',
            ))
            ->implode("\n");

        return <<<PROMPT
        Vendor category: {$vendorNeed->category}
        Required specification:
        {$vendorNeed->specification}

        Quotes received:
        {$quoteLines}

        For every quote return spec_score from 0 to 100 describing how well the offer meets the required specification
        (100 = fully meets or exceeds, 0 = unrelated or no information), plus a one or two sentence reason.
        PROMPT;
    }

    /**
     * @return array<string, mixed>
     */
    private function schema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'results' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'quote_id' => ['type' => 'integer'],
                            'spec_score' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 100],
                            'reason' => ['type' => 'string'],
                        ],
                        'required' => ['quote_id', 'spec_score', 'reason'],
                    ],
                ],
            ],
            'required' => ['results'],
        ];
    }
}