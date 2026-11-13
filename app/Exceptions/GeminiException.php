<?php

namespace App\Exceptions;

use RuntimeException;
use Throwable;

class GeminiException extends RuntimeException
{
    public static function missingApiKey(): self
    {
        return new self('The Gemini API key is not configured. Set GEMINI_API_KEY in your .env file.');
    }

    public static function requestFailed(int $status, Throwable $previous): self
    {
        $message = match (true) {
            $status === 429 => 'The AI service is busy right now. Please try again in a minute.',
            $status >= 500 => 'The AI service is temporarily unavailable. Please try again later.',
            default => "The AI service rejected the request (HTTP {$status}).",
        };

        return new self($message, $status, $previous);
    }

    public static function unreachable(Throwable $previous): self
    {
        return new self('The AI service could not be reached. Please try again later.', 0, $previous);
    }

    public static function emptyResponse(): self
    {
        return new self('Gemini returned an empty response.');
    }

    public static function invalidJson(): self
    {
        return new self('Gemini returned a response that is not valid JSON.');
    }

    public static function unusableResult(string $reason): self
    {
        return new self("Gemini returned an unusable result: {$reason}");
    }
}
