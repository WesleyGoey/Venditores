<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind a different classes or traits.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

/**
 * Build a Gemini generateContent response body whose text part is the given JSON.
 *
 * @param  array<string, mixed>  $json
 * @return array<string, mixed>
 */
function geminiResponse(array $json): array
{
    return [
        'candidates' => [
            [
                'content' => [
                    'role' => 'model',
                    'parts' => [['text' => json_encode($json)]],
                ],
                'finishReason' => 'STOP',
            ],
        ],
    ];
}

/**
 * The Gemini endpoint every AI feature calls.
 */
function geminiEndpoint(): string
{
    return 'generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent';
}
