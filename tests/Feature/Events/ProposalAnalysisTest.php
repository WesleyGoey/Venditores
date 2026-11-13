<?php

use App\Enums\EventStatus;
use App\Models\Event;
use App\Models\Quote;
use App\Models\User;
use App\Models\VendorNeed;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Sleep;

function analysisResult(): array
{
    return [
        'summary' => 'A two-day campus technology festival.',
        'scale' => 'medium',
        'estimated_attendees' => 800,
        'vendor_needs' => [
            ['category' => 'Venue', 'specification' => 'Hall for 800 people', 'allocation_percentage' => 40, 'is_vital' => true],
            ['category' => 'Catering', 'specification' => '800 lunch boxes x 2 days', 'allocation_percentage' => 35, 'is_vital' => true],
            ['category' => 'Documentation', 'specification' => '2 photographers', 'allocation_percentage' => 25, 'is_vital' => false],
        ],
    ];
}

test('it creates vendor needs with rupiah allocations from gemini percentages', function () {
    Http::preventStrayRequests();
    Storage::fake('local');
    Storage::disk('local')->put('proposals/a.pdf', '%PDF-1.4 proposal');
    $event = Event::factory()->withProposal('proposals/a.pdf')->create(['total_budget' => 100_000_001]);
    Http::fake([geminiEndpoint() => Http::response(geminiResponse(analysisResult()))]);

    $this->actingAs($event->user)
        ->post(route('events.analysis.store', $event))
        ->assertRedirect(route('events.show', $event))
        ->assertSessionHas('success');

    $event->refresh();
    expect($event)
        ->status->toBe(EventStatus::Analyzed)
        ->scale->toBe('medium')
        ->estimated_attendees->toBe(800)
        ->analyzed_at->not->toBeNull();

    $needs = $event->vendorNeeds()->orderBy('id')->get();
    expect($needs->pluck('category')->all())->toBe(['Venue', 'Catering', 'Documentation'])
        ->and($needs->pluck('allocated_budget')->all())->toBe([40_000_001, 35_000_000, 25_000_000])
        ->and($needs->pluck('allocation_basis_points')->all())->toBe([4_000, 3_500, 2_500])
        ->and($needs->pluck('is_vital')->all())->toBe([true, true, false]);

    Http::assertSent(fn (Request $request) => $request->hasHeader('x-goog-api-key', 'testing-gemini-key')
        && $request['contents'][0]['parts'][0]['inlineData']['mimeType'] === 'application/pdf'
        && $request['contents'][0]['parts'][0]['inlineData']['data'] === base64_encode('%PDF-1.4 proposal')
        && $request['generationConfig']['responseMimeType'] === 'application/json');
});

test('re-analysis replaces the previous vendor needs and their quotes', function () {
    Storage::fake('local');
    Storage::disk('local')->put('proposals/a.pdf', '%PDF');
    $event = Event::factory()->withProposal('proposals/a.pdf')->create();
    $oldQuote = Quote::factory()->for(VendorNeed::factory()->for($event))->create();
    Http::fake([geminiEndpoint() => Http::response(geminiResponse(analysisResult()))]);

    $this->actingAs($event->user)->post(route('events.analysis.store', $event));

    $this->assertModelMissing($oldQuote);
    expect($event->vendorNeeds()->count())->toBe(3);
});

test('it retries when gemini is overloaded', function () {
    Sleep::fake();
    Storage::fake('local');
    Storage::disk('local')->put('proposals/a.pdf', '%PDF');
    $event = Event::factory()->withProposal('proposals/a.pdf')->create();
    Http::fake([
        geminiEndpoint() => Http::sequence()
            ->push(['error' => 'overloaded'], 503)
            ->push(geminiResponse(analysisResult())),
    ]);

    $this->actingAs($event->user)->post(route('events.analysis.store', $event));

    Http::assertSentCount(2);
    expect($event->vendorNeeds()->count())->toBe(3);
});

test('it shows an error and keeps the event unchanged when gemini fails', function () {
    Sleep::fake();
    Storage::fake('local');
    Storage::disk('local')->put('proposals/a.pdf', '%PDF');
    $event = Event::factory()->withProposal('proposals/a.pdf')->create();
    $existingNeed = VendorNeed::factory()->for($event)->create();
    Http::fake([geminiEndpoint() => Http::response(['error' => 'quota'], 429)]);

    $this->actingAs($event->user)
        ->from(route('events.show', $event))
        ->post(route('events.analysis.store', $event))
        ->assertRedirect(route('events.show', $event))
        ->assertSessionHas('error', 'The AI service is busy right now. Please try again in a minute.');

    Http::assertSentCount(3);
    $this->assertModelExists($existingNeed);
    expect($event->refresh()->status)->toBe(EventStatus::Draft);
});

test('it rejects gemini results without vendor needs', function () {
    Storage::fake('local');
    Storage::disk('local')->put('proposals/a.pdf', '%PDF');
    $event = Event::factory()->withProposal('proposals/a.pdf')->create();
    Http::fake([geminiEndpoint() => Http::response(geminiResponse([...analysisResult(), 'vendor_needs' => []]))]);

    $this->actingAs($event->user)
        ->post(route('events.analysis.store', $event))
        ->assertSessionHas('error', 'Gemini returned an unusable result: no vendor needs were returned.');

    expect($event->refresh()->status)->toBe(EventStatus::Draft);
});

test('it asks for a proposal before analyzing', function () {
    Http::preventStrayRequests();
    $event = Event::factory()->create();

    $this->actingAs($event->user)
        ->post(route('events.analysis.store', $event))
        ->assertSessionHas('error', 'Upload a proposal PDF before running the analysis.');
});

test('other users cannot analyze the event', function () {
    Http::preventStrayRequests();
    $event = Event::factory()->withProposal()->create();

    $this->actingAs(User::factory()->create())
        ->post(route('events.analysis.store', $event))
        ->assertNotFound();
});

test('analysis is limited to 5 requests per minute per user', function () {
    Http::preventStrayRequests();
    $event = Event::factory()->create();

    foreach (range(1, 5) as $attempt) {
        $this->actingAs($event->user)->post(route('events.analysis.store', $event));
    }

    $this->actingAs($event->user)
        ->post(route('events.analysis.store', $event))
        ->assertSessionHas('error', 'Too many AI requests. Please wait a minute and try again.');
});
