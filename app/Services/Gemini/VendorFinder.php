<?php

namespace App\Services\Gemini;

use App\Exceptions\GeminiException;
use App\Models\VendorNeed;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Throwable;

class VendorFinder
{
    public const MAX_RESULTS = 6;

    /**
     * How many web pages Tavily returns for Gemini to read.
     */
    private const SEARCH_RESULTS = 10;

    public function __construct(private GeminiClient $gemini) {}

    /**
     * Search the web for vendors that could fulfil a need.
     *
     * Tavily runs the web search and Gemini only turns those pages into a vendor list,
     * so every vendor comes from a real page. Gemini's own Google Search grounding is not
     * used because the free Gemini tier has no search quota.
     *
     * @return array{vendors: list<array{name: string, summary: string, website: ?string, contact: ?string, estimated_price: ?int, price_unit: ?string}>, sources: list<array{title: string, url: string}>}
     *
     * @throws GeminiException
     */
    public function find(VendorNeed $vendorNeed, ?string $keywords = null): array
    {
        $vendorNeed->loadMissing('event');

        $pages = $this->searchWeb($vendorNeed, $keywords);

        if ($pages === []) {
            throw GeminiException::unusableResult('no vendors were found. Try different keywords.');
        }

        $result = $this->gemini->generateJson(
            parts: [['text' => $this->prompt($vendorNeed, $keywords, $pages)]],
            responseSchema: $this->schema(),
            systemInstruction: 'You help event organizers pick vendors from web search results. Use only vendors, websites, contacts and prices that appear in the given results. Never invent any of them: use null when the results do not state it.',
        );

        $vendors = collect($result['vendors'] ?? [])
            ->filter(fn(mixed $row): bool => is_array($row) && filled($row['name'] ?? null))
            ->map(function (array $row): array {
                $price = $this->price($row['estimated_price'] ?? null);

                return [
                    'name' => mb_substr(trim((string) $row['name']), 0, 255),
                    'summary' => mb_substr(trim((string) ($row['summary'] ?? '')), 0, 1000),
                    'website' => $this->safeUrl($row['website'] ?? null),
                    'contact' => filled($row['contact'] ?? null) ? mb_substr(trim((string) $row['contact']), 0, 255) : null,
                    'estimated_price' => $price,
                    // A unit only means something next to a price; null means the price is the total for the whole job.
                    'price_unit' => $price !== null && filled($row['price_unit'] ?? null) ? mb_substr(trim((string) $row['price_unit']), 0, 30) : null,
                ];
            })
            ->take(self::MAX_RESULTS)
            ->values()
            ->all();

        if ($vendors === []) {
            throw GeminiException::unusableResult('no vendors were found. Try different keywords.');
        }

        return [
            'vendors' => $vendors,
            'sources' => collect($pages)->map(fn(array $page): array => ['title' => $page['title'], 'url' => $page['url']])->all(),
        ];
    }

    /**
     * Web pages that match the need, from the Tavily search API.
     *
     * @return list<array{title: string, url: string, content: string}>
     *
     * @throws GeminiException
     */
    private function searchWeb(VendorNeed $vendorNeed, ?string $keywords): array
    {
        $apiKey = config('services.tavily.key');

        if (blank($apiKey)) {
            throw GeminiException::missingSearchKey();
        }

        $query = collect(['vendor', $vendorNeed->category, $keywords, $vendorNeed->event->location ?: 'Indonesia'])
            ->filter(fn(?string $part): bool => filled($part))
            ->implode(' ');

        try {
            $response = Http::withToken($apiKey)
                ->acceptJson()
                ->connectTimeout(10)
                ->timeout(30)
                // Only connection drops are retried; Tavily's own error answers come back as they are.
                ->retry(3, 500, fn(Throwable $exception): bool => $exception instanceof ConnectionException, throw: false)
                ->post(rtrim(config('services.tavily.base_url'), '/') . '/search', [
                    'query' => $query,
                    'search_depth' => 'basic',
                    'max_results' => self::SEARCH_RESULTS,
                ])
                ->throw();
        } catch (RequestException $exception) {
            throw GeminiException::searchFailed($exception->response->status(), $exception);
        } catch (ConnectionException $exception) {
            throw GeminiException::searchUnreachable($exception);
        }

        return collect($response->json('results', []))
            ->filter(fn(mixed $page): bool => is_array($page) && $this->safeUrl($page['url'] ?? null) !== null)
            ->map(fn(array $page): array => [
                'title' => mb_substr(trim((string) ($page['title'] ?? '')), 0, 255),
                'url' => $this->safeUrl($page['url']),
                'content' => mb_substr(trim((string) ($page['content'] ?? '')), 0, 1500),
            ])
            ->unique('url')
            ->values()
            ->all();
    }

    /**
     * @param  list<array{title: string, url: string, content: string}>  $pages
     */
    private function prompt(VendorNeed $vendorNeed, ?string $keywords, array $pages): string
    {
        $location = $vendorNeed->event->location ?: 'Indonesia';
        $extra = filled($keywords) ? "Extra keywords from the organizer: {$keywords}\n" : '';
        $max = self::MAX_RESULTS;
        $results = collect($pages)
            ->map(fn(array $page, int $index): string => sprintf("[%d] %s\nURL: %s\n%s", $index + 1, $page['title'], $page['url'], $page['content']))
            ->implode("\n\n");

        return <<<PROMPT
        From the web search results below, list up to {$max} real vendors for this event need.

        Event: {$vendorNeed->event->name}
        Event location: {$location}
        Vendor category: {$vendorNeed->category}
        Specification: {$vendorNeed->specification}
        Allocated budget (Rupiah): {$vendorNeed->allocated_budget}
        {$extra}
        Prefer vendors that operate in or near the event location and fit the specification.
        Skip pages that are not about a vendor (news, marketplaces without a named seller, job ads).
        - name: the vendor's business name as written in the results.
        - summary: one or two sentences on what they offer and why they fit the specification.
        - website: the result URL of the vendor's own site or listing, or null.
        - contact: phone, WhatsApp or email written in the results, or null.
        - estimated_price: a price in Rupiah only if the results state one, otherwise null.
        - price_unit: what estimated_price is charged per, as one short word in the language of the specification (for example box, orang, hari, jam, unit, paket). Null when estimated_price is the total for the whole job, or when there is no price.
        Write the summaries in the same language as the specification.

        Web search results:
        {$results}
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
                'vendors' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'name' => ['type' => 'string'],
                            'summary' => ['type' => 'string'],
                            'website' => ['type' => ['string', 'null']],
                            'contact' => ['type' => ['string', 'null']],
                            'estimated_price' => ['type' => ['integer', 'null']],
                            'price_unit' => ['type' => ['string', 'null']],
                        ],
                        'required' => ['name', 'summary', 'website', 'contact', 'estimated_price', 'price_unit'],
                    ],
                ],
            ],
            'required' => ['vendors'],
        ];
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
