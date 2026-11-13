<?php

namespace App\Services\Gemini;

use App\Exceptions\GeminiException;
use App\Http\Requests\StoreEventRequest;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Throwable;

/**
 * Reads the basic event details (name, date, location, budget, description)
 * from a proposal PDF so the committee does not have to type them.
 */
class ProposalExtractor
{
    public function __construct(private GeminiClient $gemini) {}

    /**
     * Only fields the proposal clearly states are returned, already validated.
     *
     * @return array{name?: string, event_date?: string, location?: string, total_budget?: int, description?: string}
     *
     * @throws GeminiException
     */
    public function extract(string $pdfBytes): array
    {
        $result = $this->gemini->generateJson(
            parts: [
                ['inlineData' => ['mimeType' => 'application/pdf', 'data' => base64_encode($pdfBytes)]],
                ['text' => $this->prompt()],
            ],
            responseSchema: $this->schema(),
            systemInstruction: 'You read event proposals and extract facts exactly as written. Never guess. Use null when the proposal does not state a value.',
        );

        return array_filter([
            'name' => $this->text($result['name'] ?? null, 255),
            'event_date' => $this->date($result['event_date'] ?? null),
            'location' => $this->text($result['location'] ?? null, 255),
            'total_budget' => $this->budget($result['total_budget'] ?? null),
            'description' => $this->text($result['description'] ?? null, 5000),
        ], fn (mixed $value): bool => $value !== null);
    }

    private function prompt(): string
    {
        $today = now()->toDateString();

        return <<<PROMPT
        Extract these details from the attached event proposal. Today is {$today}.

        - name: the event name.
        - event_date: the date the event starts, as YYYY-MM-DD. Null if no full date is stated.
        - location: the city or venue, short.
        - total_budget: the total event budget in Rupiah as a whole number (no dots, commas or "Rp"). Null if there is no total budget.
        - description: 1 to 3 sentences on what the event is and who it is for.

        Write the description in the same language as the proposal.
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
                'name' => ['type' => ['string', 'null']],
                'event_date' => ['type' => ['string', 'null']],
                'location' => ['type' => ['string', 'null']],
                'total_budget' => ['type' => ['integer', 'null']],
                'description' => ['type' => ['string', 'null']],
            ],
            'required' => ['name', 'event_date', 'location', 'total_budget', 'description'],
        ];
    }

    private function text(mixed $value, int $max): ?string
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        return Str::limit(trim($value), $max, '');
    }

    private function date(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        try {
            $date = Carbon::createFromFormat('!Y-m-d', trim($value));
        } catch (Throwable) {
            return null;
        }

        return $date !== false && $date->toDateString() === trim($value) ? $date->toDateString() : null;
    }

    private function budget(mixed $value): ?int
    {
        if (! is_numeric($value) || $value <= 0 || $value > StoreEventRequest::MAX_BUDGET) {
            return null;
        }

        return (int) round((float) $value);
    }
}
