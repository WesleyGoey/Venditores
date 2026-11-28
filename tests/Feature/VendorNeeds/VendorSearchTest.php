<?php

use App\Enums\ProcurementStatus;
use App\Models\Event;
use App\Models\User;
use App\Models\VendorNeed;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

const TAVILY_SEARCH = 'api.tavily.com/search';

/**
 * @param  list<array<string, mixed>>  $results
 */
function tavilyResponse(array $results): array
{
    return ['query' => 'vendor', 'results' => $results];
}

function tavilyPage(string $url = 'https://sedap.example', string $content = 'Katering Sedap, box lunch halal. WA 0812.'): array
{
    return ['title' => 'Katering Sedap Surabaya', 'url' => $url, 'content' => $content, 'score' => 0.9];
}

beforeEach(function () {
    Http::preventStrayRequests();
});

test('it finds vendors from web search results and moves a drafting need to searching', function () {
    $need = VendorNeed::factory()->for(Event::factory()->state(['location' => 'Surabaya']))->create([
        'category' => 'Catering',
        'procurement_status' => ProcurementStatus::Drafting,
    ]);
    Http::fake([
        TAVILY_SEARCH => Http::response(tavilyResponse([
            tavilyPage(),
            tavilyPage(url: 'javascript:alert(1)'),
        ])),
        geminiEndpoint() => Http::response(geminiResponse(['vendors' => [
            ['name' => 'Katering Sedap', 'summary' => 'Box lunch.', 'website' => 'https://sedap.example', 'contact' => '0812', 'estimated_price' => 9_000_000, 'price_unit' => 'box'],
            ['name' => 'Katering Bahaya', 'summary' => 'x', 'website' => 'javascript:alert(1)', 'contact' => null, 'estimated_price' => -5, 'price_unit' => 'box'],
        ]])),
    ]);

    $this->actingAs($need->event->user)
        ->postJson(route('events.vendor-needs.search.store', [$need->event, $need]), ['keywords' => 'halal'])
        ->assertOk()
        ->assertJsonPath('vendors.0.name', 'Katering Sedap')
        ->assertJsonPath('vendors.0.website', 'https://sedap.example')
        ->assertJsonPath('vendors.0.estimated_price', 9_000_000)
        ->assertJsonPath('vendors.0.price_unit', 'box')
        ->assertJsonPath('vendors.1.website', null)
        ->assertJsonPath('vendors.1.estimated_price', null)
        ->assertJsonPath('vendors.1.price_unit', null)
        ->assertJsonCount(1, 'sources')
        ->assertJsonPath('sources.0.url', 'https://sedap.example');

    expect($need->refresh()->procurement_status)->toBe(ProcurementStatus::Searching);

    Http::assertSent(fn(Request $request) => str_contains($request->url(), TAVILY_SEARCH)
        && $request->hasHeader('Authorization', 'Bearer testing-tavily-key')
        && str_contains($request['query'], 'Catering')
        && str_contains($request['query'], 'halal')
        && str_contains($request['query'], 'Surabaya'));

    Http::assertSent(fn(Request $request) => str_contains($request->url(), geminiEndpoint())
        && ! isset($request['tools'])
        && str_contains($request['contents'][0]['parts'][0]['text'], 'Katering Sedap, box lunch halal. WA 0812.'));
});

test('it does not move a need that is already past drafting', function () {
    $need = VendorNeed::factory()->create(['procurement_status' => ProcurementStatus::Quoted]);
    Http::fake([
        TAVILY_SEARCH => Http::response(tavilyResponse([tavilyPage()])),
        geminiEndpoint() => Http::response(geminiResponse(['vendors' => [['name' => 'A']]])),
    ]);

    $this->actingAs($need->event->user)
        ->postJson(route('events.vendor-needs.search.store', [$need->event, $need]))
        ->assertOk();

    expect($need->refresh()->procurement_status)->toBe(ProcurementStatus::Quoted);
});

test('it reports a readable error when the results hold no vendor', function () {
    $need = VendorNeed::factory()->create();
    Http::fake([
        TAVILY_SEARCH => Http::response(tavilyResponse([tavilyPage()])),
        geminiEndpoint() => Http::response(geminiResponse(['vendors' => []])),
    ]);

    $this->actingAs($need->event->user)
        ->postJson(route('events.vendor-needs.search.store', [$need->event, $need]))
        ->assertStatus(502)
        ->assertJsonPath('message', 'Gemini returned an unusable result: no vendors were found. Try different keywords.');
});

test('it does not ask Gemini when the web search finds nothing', function () {
    $need = VendorNeed::factory()->create();
    Http::fake([TAVILY_SEARCH => Http::response(tavilyResponse([]))]);

    $this->actingAs($need->event->user)
        ->postJson(route('events.vendor-needs.search.store', [$need->event, $need]))
        ->assertStatus(502);

    Http::assertSentCount(1);
});

test('it reports a readable error when the web search limit is reached', function () {
    $need = VendorNeed::factory()->create();
    Http::fake([TAVILY_SEARCH => Http::response(['detail' => ['error' => 'Plan limit exceeded']], 432)]);

    $this->actingAs($need->event->user)
        ->postJson(route('events.vendor-needs.search.store', [$need->event, $need]))
        ->assertStatus(502)
        ->assertJsonPath('message', 'The web search limit was reached. Please try again later.');
});

test('it reports a missing web search key without calling any service', function () {
    config(['services.tavily.key' => null]);
    $need = VendorNeed::factory()->create();

    $this->actingAs($need->event->user)
        ->postJson(route('events.vendor-needs.search.store', [$need->event, $need]))
        ->assertStatus(502)
        ->assertJsonPath('message', 'The web search API key is not configured. Set TAVILY_API_KEY in your .env file.');
});

test('other users cannot search for vendors', function () {
    $need = VendorNeed::factory()->create();

    $this->actingAs(User::factory()->create())
        ->postJson(route('events.vendor-needs.search.store', [$need->event, $need]))
        ->assertNotFound();
});

test('vendor search is limited to 10 requests per minute per user', function () {
    $need = VendorNeed::factory()->create();
    Http::fake([
        TAVILY_SEARCH => Http::response(tavilyResponse([tavilyPage()])),
        geminiEndpoint() => Http::response(geminiResponse(['vendors' => [['name' => 'A']]])),
    ]);

    foreach (range(1, 10) as $attempt) {
        $this->actingAs($need->event->user)->postJson(route('events.vendor-needs.search.store', [$need->event, $need]));
    }

    $this->actingAs($need->event->user)
        ->postJson(route('events.vendor-needs.search.store', [$need->event, $need]))
        ->assertStatus(429);
});
