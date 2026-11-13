<?php

use App\Enums\ProcurementStatus;
use App\Models\Event;
use App\Models\User;
use App\Models\VendorNeed;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

function groundedResponse(string $text, array $chunks = []): array
{
    return [
        'candidates' => [[
            'content' => ['role' => 'model', 'parts' => [['text' => $text]]],
            'groundingMetadata' => ['groundingChunks' => $chunks],
        ]],
    ];
}

test('it finds vendors on the web and moves a drafting need to searching', function () {
    $need = VendorNeed::factory()->for(Event::factory()->state(['location' => 'Surabaya']))->create([
        'category' => 'Catering',
        'procurement_status' => ProcurementStatus::Drafting,
    ]);
    Http::fake([geminiEndpoint() => Http::response(groundedResponse(
        "```json\n".json_encode(['vendors' => [
            ['name' => 'Katering Sedap', 'summary' => 'Box lunch.', 'website' => 'https://sedap.example', 'contact' => '0812', 'estimated_price' => 9_000_000],
            ['name' => 'Katering Bahaya', 'summary' => 'x', 'website' => 'javascript:alert(1)', 'contact' => null, 'estimated_price' => -5],
        ]])."\n```",
        [['web' => ['uri' => 'https://example.com/a', 'title' => 'Example']]],
    ))]);

    $this->actingAs($need->event->user)
        ->postJson(route('events.vendor-needs.search.store', [$need->event, $need]), ['keywords' => 'halal'])
        ->assertOk()
        ->assertJsonPath('vendors.0.name', 'Katering Sedap')
        ->assertJsonPath('vendors.0.website', 'https://sedap.example')
        ->assertJsonPath('vendors.0.estimated_price', 9_000_000)
        ->assertJsonPath('vendors.1.website', null)
        ->assertJsonPath('vendors.1.estimated_price', null)
        ->assertJsonPath('sources.0.url', 'https://example.com/a');

    expect($need->refresh()->procurement_status)->toBe(ProcurementStatus::Searching);

    Http::assertSent(fn (Request $request) => isset($request['tools'][0]['google_search'])
        && str_contains($request['contents'][0]['parts'][0]['text'], 'Surabaya')
        && str_contains($request['contents'][0]['parts'][0]['text'], 'halal'));
});

test('it does not move a need that is already past drafting', function () {
    $need = VendorNeed::factory()->create(['procurement_status' => ProcurementStatus::Quoted]);
    Http::fake([geminiEndpoint() => Http::response(groundedResponse(json_encode(['vendors' => [['name' => 'A']]])))]);

    $this->actingAs($need->event->user)
        ->postJson(route('events.vendor-needs.search.store', [$need->event, $need]))
        ->assertOk();

    expect($need->refresh()->procurement_status)->toBe(ProcurementStatus::Quoted);
});

test('it reports a readable error when nothing usable comes back', function () {
    $need = VendorNeed::factory()->create();
    Http::fake([geminiEndpoint() => Http::response(groundedResponse('Sorry, I found nothing.'))]);

    $this->actingAs($need->event->user)
        ->postJson(route('events.vendor-needs.search.store', [$need->event, $need]))
        ->assertStatus(502)
        ->assertJsonStructure(['message']);
});

test('other users cannot search for vendors', function () {
    Http::preventStrayRequests();
    $need = VendorNeed::factory()->create();

    $this->actingAs(User::factory()->create())
        ->postJson(route('events.vendor-needs.search.store', [$need->event, $need]))
        ->assertNotFound();
});

test('vendor search is limited to 10 requests per minute per user', function () {
    $need = VendorNeed::factory()->create();
    Http::fake([geminiEndpoint() => Http::response(groundedResponse(json_encode(['vendors' => [['name' => 'A']]])))]);

    foreach (range(1, 10) as $attempt) {
        $this->actingAs($need->event->user)->postJson(route('events.vendor-needs.search.store', [$need->event, $need]));
    }

    $this->actingAs($need->event->user)
        ->postJson(route('events.vendor-needs.search.store', [$need->event, $need]))
        ->assertStatus(429);
});
