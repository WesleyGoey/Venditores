<?php

namespace App\Services\Gemini;

use App\Enums\RiskLevel;
use App\Exceptions\GeminiException;
use App\Models\Event;
use App\Models\VendorNeed;
use App\Services\RiskMonitor;

class RiskAdvisor
{
    public function __construct(
        private GeminiClient $gemini,
        private RiskMonitor $monitor,
    ) {}

    /**
     * Ask Gemini for mitigation advice based on the RiskMonitor assessment.
     *
     * The risk level itself is always decided by the RiskMonitor.
     *
     * @throws GeminiException
     */
    public function advise(Event $event): Event
    {
        $event->loadMissing('vendorNeeds');

        $assessment = $this->monitor->assess($event);

        $result = $this->gemini->generateJson(
            parts: [['text' => $this->prompt($event, $assessment)]],
            responseSchema: $this->schema(),
            systemInstruction: 'You are a pragmatic event risk advisor in Indonesia. Give short, concrete, actionable advice. Write in the same language as the event data.',
        );

        $recommendations = collect($result['recommendations'] ?? [])
            ->filter(fn (mixed $item): bool => is_string($item) && trim($item) !== '')
            ->map(fn (string $item): string => trim($item))
            ->values()
            ->all();

        if ($recommendations === []) {
            throw GeminiException::unusableResult('no recommendations were returned.');
        }

        $event->update([
            'risk_advice' => [
                'level' => $assessment['level']->value,
                'headline' => trim((string) ($result['headline'] ?? '')),
                'recommendations' => $recommendations,
            ],
            'risk_advised_at' => now(),
        ]);

        return $event;
    }

    /**
     * @param  array{level: RiskLevel, days_remaining: int, unsecured_needs: int, unsecured_vital_needs: list<string>}  $assessment
     */
    private function prompt(Event $event, array $assessment): string
    {
        $needLines = $event->vendorNeeds
            ->map(fn (VendorNeed $need): string => sprintf(
                '- %s (%s, status: %s, budget: Rp %d)',
                $need->category,
                $need->is_vital ? 'vital' : 'optional',
                $need->procurement_status->value,
                $need->allocated_budget,
            ))
            ->implode("\n");

        return <<<PROMPT
        Event: {$event->name}
        Event date: {$event->event_date->toDateString()} ({$assessment['days_remaining']} days remaining)
        Risk level: {$assessment['level']->value}
        Unsecured vendor needs: {$assessment['unsecured_needs']}

        Vendor needs:
        {$needLines}

        Give a one sentence headline about the procurement risk and 3 to 5 prioritised recommendations
        that help the committee secure the remaining vendors in time.
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
                'headline' => ['type' => 'string'],
                'recommendations' => [
                    'type' => 'array',
                    'items' => ['type' => 'string'],
                ],
            ],
            'required' => ['headline', 'recommendations'],
        ];
    }
}