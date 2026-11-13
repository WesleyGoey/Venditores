<?php

namespace App\Services\Gemini;

use App\Exceptions\GeminiException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Throwable;

class GeminiClient
{
    /**
     * HTTP statuses that are worth retrying.
     *
     * @var list<int>
     */
    private const RETRYABLE_STATUSES = [429, 500, 503];

    /**
     * Send a prompt to Gemini and decode its structured JSON output.
     *
     * @param  list<array<string, mixed>>  $parts
     * @param  array<string, mixed>  $responseSchema
     * @return array<string, mixed>
     *
     * @throws GeminiException
     */
    public function generateJson(array $parts, array $responseSchema, ?string $systemInstruction = null): array
    {
        $apiKey = config('services.gemini.key');

        if (blank($apiKey)) {
            throw GeminiException::missingApiKey();
        }

        $payload = [
            'contents' => [
                ['role' => 'user', 'parts' => $parts],
            ],
            'generationConfig' => [
                'responseMimeType' => 'application/json',
                'responseJsonSchema' => $responseSchema,
            ],
        ];

        if ($systemInstruction !== null) {
            $payload['systemInstruction'] = ['parts' => [['text' => $systemInstruction]]];
        }

        try {
            $response = Http::withHeaders(['x-goog-api-key' => $apiKey])
                ->acceptJson()
                ->connectTimeout(10)
                ->timeout(config('services.gemini.timeout'))
                ->retry([2000, 5000], 0, fn (Throwable $exception): bool => $this->shouldRetry($exception))
                ->post($this->endpoint(), $payload)
                ->throw();
        } catch (RequestException $exception) {
            throw GeminiException::requestFailed($exception->response->status(), $exception);
        } catch (ConnectionException $exception) {
            throw GeminiException::unreachable($exception);
        }

        $text = collect($response->json('candidates.0.content.parts', []))
            ->pluck('text')
            ->filter()
            ->implode('');

        if ($text === '') {
            throw GeminiException::emptyResponse();
        }

        $decoded = json_decode($text, true);

        if (! is_array($decoded)) {
            throw GeminiException::invalidJson();
        }

        return $decoded;
    }

    /**
     * Ask Gemini a question with Google Search grounding enabled.
     *
     * Search grounding cannot be combined with a response schema, so the
     * answer comes back as plain text plus the web pages Gemini consulted.
     *
     * @return array{text: string, sources: list<array{title: string, url: string}>}
     *
     * @throws GeminiException
     */
    public function generateGrounded(string $prompt, ?string $systemInstruction = null): array
    {
        $apiKey = config('services.gemini.key');

        if (blank($apiKey)) {
            throw GeminiException::missingApiKey();
        }

        $payload = [
            'contents' => [
                ['role' => 'user', 'parts' => [['text' => $prompt]]],
            ],
            'tools' => [['google_search' => (object) []]],
        ];

        if ($systemInstruction !== null) {
            $payload['systemInstruction'] = ['parts' => [['text' => $systemInstruction]]];
        }

        try {
            $response = Http::withHeaders(['x-goog-api-key' => $apiKey])
                ->acceptJson()
                ->connectTimeout(10)
                ->timeout(config('services.gemini.timeout'))
                ->retry([2000, 5000], 0, fn (Throwable $exception): bool => $this->shouldRetry($exception))
                ->post($this->endpoint(), $payload)
                ->throw();
        } catch (RequestException $exception) {
            throw GeminiException::requestFailed($exception->response->status(), $exception);
        } catch (ConnectionException $exception) {
            throw GeminiException::unreachable($exception);
        }

        $text = collect($response->json('candidates.0.content.parts', []))
            ->pluck('text')
            ->filter()
            ->implode('');

        if ($text === '') {
            throw GeminiException::emptyResponse();
        }

        $sources = collect($response->json('candidates.0.groundingMetadata.groundingChunks', []))
            ->map(fn (array $chunk): array => [
                'title' => (string) ($chunk['web']['title'] ?? ''),
                'url' => (string) ($chunk['web']['uri'] ?? ''),
            ])
            ->filter(fn (array $source): bool => preg_match('#^https?://#i', $source['url']) === 1)
            ->unique('url')
            ->values()
            ->all();

        return ['text' => $text, 'sources' => $sources];
    }

    private function endpoint(): string
    {
        return sprintf(
            '%s/models/%s:generateContent',
            rtrim(config('services.gemini.base_url'), '/'),
            config('services.gemini.model'),
        );
    }

    private function shouldRetry(Throwable $exception): bool
    {
        if ($exception instanceof ConnectionException) {
            return true;
        }

        return $exception instanceof RequestException
            && in_array($exception->response->status(), self::RETRYABLE_STATUSES, true);
    }
}
