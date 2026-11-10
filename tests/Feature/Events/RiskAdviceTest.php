<?php

use App\Enums\ProcurementStatus;
use App\Models\Event;
use App\Models\User;
use App\Models\VendorNeed;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

test('it stores gemini advice together with the monitored risk level', function () {
    Http::preventStrayRequests();
    $this->freezeTime();
    $event = Event::factory()->analyzed()->inDays(45)->create();
    VendorNeed::factory()->for($event)->vital()->create(['category' => 'Venue']);
    Http::fake([geminiEndpoint() => Http::response(geminiResponse([
        'headline' => 'Venue is still open with 45 days left.',
        'recommendations' => ['Shortlist three venues this week.', '  ', 'Prepare a backup date.'],
    ]))]);

    $this->actingAs($event->user)
        ->post(route('events.risk-advice.store', $event))
        ->assertSessionHas('success');

    expect($event->refresh()->risk_advice)->toBe([
        'level' => 'warning',
        'headline' => 'Venue is still open with 45 days left.',
        'recommendations' => ['Shortlist three venues this week.', 'Prepare a backup date.'],
    ])->and($event->risk_advised_at)->not->toBeNull();

    Http::assertSent(fn (Request $request) => str_contains($request['contents'][0]['parts'][0]['text'], 'Risk level: warning'));
});

test('other users cannot request advice', function () {
    Http::preventStrayRequests();
    $event = Event::factory()->create();

    $this->actingAs(User::factory()->create())
        ->post(route('events.risk-advice.store', $event))
        ->assertNotFound();
});

test('it reports a missing api key instead of calling gemini', function () {
    Http::preventStrayRequests();
    config(['services.gemini.key' => null]);
    $event = Event::factory()->create();
    VendorNeed::factory()->for($event)->create(['procurement_status' => ProcurementStatus::Searching]);

    $this->actingAs($event->user)
        ->post(route('events.risk-advice.store', $event))
        ->assertSessionHas('error', 'The Gemini API key is not configured. Set GEMINI_API_KEY in your .env file.');
});