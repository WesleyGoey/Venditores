<?php

namespace App\Services\Gemini;

use App\Exceptions\GeminiException;
use App\Models\VendorNeed;

class VendorFinder
{
    public const MAX_RESULTS = 6;

    public function __construct(private GeminiClient $gemini) {}

    /**
     * Search the web (Google Search grounding) for vendors that could fulfil a need.
     *
     * @return array{vendors: list<array{name: string, summary: string, website: ?string, contact: ?string, estimated_price: ?int}>, sources: list<array{title: string, url: string}>}
     *
     * @throws GeminiException
     */
    public function find(VendorNeed $vendorNeed, ?string $keywords = null): array
    {
        $result = $this->gemini->generateGrounded(
            prompt: $this->prompt($vendorNeed, $keywords),
            systemInstruction: 'You help event organizers find real, currently operating vendors by searching the web. Never invent a vendor, website, phone number or price: use null when you did not find it on the web.',
        );

        $decoded = $this->decode($result['text']);

        $vendors = collect($decoded['vendors'] ?? [])
            ->filter(fn (mixed $row): bool => is_array($row) && filled($row['name'] ?? null))
            ->map(fn (array $row): array => [
                'name' => mb_substr(trim((string) $row['name']), 0, 255),
                'summary' => mb_substr(trim((string) ($row['summary'] ?? '')), 0, 1000),
                'website' => $this->safeUrl($row['website'] ?? null),
                'contact' => filled($row['contact'] ?? null) ? mb_substr(trim((string) $row['contact']), 0, 255) : null,
                'estimated_price' => $this->price($row['estimated_price'] ?? null),
            ])
            ->take(self::MAX_RESULTS)
            ->values()
            ->all();

        if ($vendors === []) {
            throw GeminiException::unusableResult('no vendors were found. Try different keywords.');
        }

        return ['vendors' => $vendors, 'sources' => $result['sources']];
    }

    private function prompt(VendorNeed $vendorNeed, ?string $keywords): string
    {
        $vendorNeed->loadMissing('event');

        $location = $vendorNeed->event->location ?: 'Indonesia';
        $extra = filled($keywords) ? "Extra keywords from the organizer: {$keywords}\n" : '';
        $max = self::MAX_RESULTS;

        return <<<PROMPT
        Find up to {$max} real vendors on the web for this event need.

        Event: {$vendorNeed->event->name}
        Event location: {$location}
        Vendor category: {$vendorNeed->category}
        Specification: {$vendorNeed->specification}
        Allocated budget (Rupiah): {$vendorNeed->allocated_budget}
        {$extra}
        Prefer vendors that operate in or near the event location.
        Answer with ONLY a JSON object (no markdown fences, no commentary) shaped like:
        {"vendors": [{"name": string, "summary": string, "website": string|null, "contact": string|null, "estimated_price": integer|null}]}
        - summary: one or two sentences on what they offer and why they fit the specification.
        - website: the vendor's own site or listing URL, or null.
        - contact: phone, WhatsApp or email found on the web, or null.
        - estimated_price: a price in Rupiah only if you found a published price, otherwise null.
        Write the summaries in the same language as the specification.
        PROMPT;
    }

    /**
     * Pull the JSON object out of the model's text, tolerating code fences.
     *
     * @return array<string, mixed>
     *
     * @throws GeminiException
     */
    private function decode(string $text): array
    {
        $start = strpos($text, '{');
        $end = strrpos($text, '}');

        if ($start === false || $end === false || $end < $start) {
            throw GeminiException::invalidJson();
        }

        $decoded = json_decode(substr($text, $start, $end - $start + 1), true);

        if (! is_array($decoded)) {
            throw GeminiException::invalidJson();
        }

        return $decoded;
    }

    /**
     * Only plain http(s) links are passed on, so a result can never carry a javascript: URL.
     */
    private function safeUrl(mixed $url): ?string
    {
        if (! is_string($url) || ! preg_match('#^https?://#i', trim($url))) {
            return null;
        }

        return filter_var(trim($url), FILTER_VALIDATE_URL) ?: null;
    }

    private function price(mixed $value): ?int
    {
        if (! is_numeric($value) || $value < 0 || $value > 10_000_000_000_000) {
            return null;
        }

        return (int) round((float) $value);
    }
}
