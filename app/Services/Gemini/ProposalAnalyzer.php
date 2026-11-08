<?php

namespace App\Services\Gemini;

use App\Enums\EventStatus;
use App\Enums\ProcurementStatus;
use App\Exceptions\GeminiException;
use App\Models\Event;
use App\Services\BudgetAllocator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProposalAnalyzer
{
    public function __construct(
        private GeminiClient $gemini,
        private BudgetAllocator $allocator,
    ) {}

    /**
     * Extract the event profile and vendor needs from the proposal PDF.
     *
     * Gemini only proposes allocation percentages. Rupiah amounts are always
     * calculated by the BudgetAllocator. Existing vendor needs (and their
     * quotes) are replaced by the new analysis.
     *
     * @throws GeminiException
     */
    public function analyze(Event $event): Event
    {
        $pdf = Storage::disk(config('filesystems.proposal_disk'))->get($event->proposal_path);

        if ($pdf === null) {
            throw new GeminiException('The proposal file could not be read from storage.');
        }

        $result = $this->gemini->generateJson(
            parts: [
                ['inlineData' => ['mimeType' => 'application/pdf', 'data' => base64_encode($pdf)]],
                ['text' => $this->prompt($event)],
            ],
            responseSchema: $this->schema(),
            systemInstruction: 'You are an experienced event procurement planner in Indonesia. You read event proposals and list every vendor category the committee must hire. Write in the same language as the proposal.',
        );

        $needs = $this->validNeeds($result['vendor_needs'] ?? null);

        if ($needs === []) {
            throw GeminiException::unusableResult('no vendor needs were returned.');
        }

        $allocations = $this->allocator->allocate(
            $event->total_budget,
            array_column($needs, 'allocation_percentage'),
        );

        DB::transaction(function () use ($event, $result, $needs, $allocations): void {
            $event->vendorNeeds()->delete();

            foreach ($needs as $index => $need) {
                $event->vendorNeeds()->create([
                    'category' => $need['category'],
                    'specification' => $need['specification'],
                    'is_vital' => $need['is_vital'],
                    'allocated_budget' => $allocations[$index]['amount'],
                    'allocation_basis_points' => $allocations[$index]['basis_points'],
                    'procurement_status' => ProcurementStatus::Drafting,
                ]);
            }

            $event->update([
                'status' => EventStatus::Analyzed,
                'summary' => Str::limit((string) ($result['summary'] ?? ''), 2000, ''),
                'scale' => $this->validScale($result['scale'] ?? null),
                'estimated_attendees' => is_numeric($result['estimated_attendees'] ?? null)
                    ? max(0, (int) $result['estimated_attendees'])
                    : null,
                'analyzed_at' => now(),
            ]);
        });

        return $event->refresh();
    }

    private function prompt(Event $event): string
    {
        return <<<PROMPT
        Analyse the attached event proposal.

        Event name: {$event->name}
        Event date: {$event->event_date->toDateString()}
        Location: {$event->location}
        Committee notes: {$event->description}
        Total budget: Rp {$event->total_budget}

        Tasks:
        1. Summarise the event profile (purpose, audience, format) in 2-4 sentences.
        2. Classify the event scale as "small" (< 100 attendees), "medium" (100-1000) or "large" (> 1000) and estimate the number of attendees.
        3. List every vendor category the committee needs to hire (for example venue, catering, sound system, lighting, decoration, documentation, security, printing, talent, transport). Do not miss crucial categories.
        4. For each category write a concise technical specification draft (quantities, duration, quality standard) based on the proposal.
        5. For each category give allocation_percentage: the ideal share of the total budget as a percentage. The percentages of all categories must add up to 100.
        6. Mark is_vital true when the event cannot run without that vendor.

        Never output Rupiah amounts. Only output percentages.
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
                'summary' => ['type' => 'string'],
                'scale' => ['type' => 'string', 'enum' => ['small', 'medium', 'large']],
                'estimated_attendees' => ['type' => 'integer', 'minimum' => 0],
                'vendor_needs' => [
                    'type' => 'array',
                    'minItems' => 1,
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'category' => ['type' => 'string'],
                            'specification' => ['type' => 'string'],
                            'allocation_percentage' => ['type' => 'number', 'minimum' => 0, 'maximum' => 100],
                            'is_vital' => ['type' => 'boolean'],
                        ],
                        'required' => ['category', 'specification', 'allocation_percentage', 'is_vital'],
                    ],
                ],
            ],
            'required' => ['summary', 'scale', 'estimated_attendees', 'vendor_needs'],
        ];
    }

    /**
     * @return list<array{category: string, specification: string, allocation_percentage: float, is_vital: bool}>
     */
    private function validNeeds(mixed $needs): array
    {
        if (! is_array($needs)) {
            return [];
        }

        return collect($needs)
            ->filter(fn (mixed $need): bool => is_array($need) && filled($need['category'] ?? null))
            ->map(fn (array $need): array => [
                'category' => Str::limit(trim((string) $need['category']), 255, ''),
                'specification' => trim((string) ($need['specification'] ?? '')),
                'allocation_percentage' => is_numeric($need['allocation_percentage'] ?? null)
                    ? (float) $need['allocation_percentage']
                    : 0.0,
                'is_vital' => (bool) ($need['is_vital'] ?? false),
            ])
            ->values()
            ->all();
    }

    private function validScale(mixed $scale): ?string
    {
        return in_array($scale, ['small', 'medium', 'large'], true) ? $scale : null;
    }
}