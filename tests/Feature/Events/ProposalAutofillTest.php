<?php

use App\Models\Event;
use App\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
    config(['services.gemini.key' => 'test-key']);
});

function proposalFile(): UploadedFile
{
    return UploadedFile::fake()->create('proposal.pdf', 200, 'application/pdf');
}

test('a proposal alone is enough to create an event', function () {
    Http::fake([geminiEndpoint() => Http::response(geminiResponse([
        'name' => 'Ciputra Tech Fest',
        'event_date' => '2027-03-01',
        'location' => 'Surabaya',
        'total_budget' => 150_000_000,
        'description' => 'A tech festival.',
    ]))]);
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('events.store'), ['proposal' => proposalFile()])->assertSessionHasNoErrors();

    expect($user->events()->sole())
        ->name->toBe('Ciputra Tech Fest')
        ->event_date->toDateString()->toBe('2027-03-01')
        ->location->toBe('Surabaya')
        ->total_budget->toBe(150_000_000)
        ->description->toBe('A tech festival.')
        ->proposal_path->not->toBeNull();
});

test('what the user typed is never overwritten by the proposal', function () {
    Http::fake([geminiEndpoint() => Http::response(geminiResponse([
        'name' => 'From PDF',
        'event_date' => '2027-03-01',
        'location' => 'Jakarta',
        'total_budget' => 1_000,
        'description' => 'From PDF.',
    ]))]);
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('events.store'), ['name' => 'My Name', 'location' => 'Bali', 'proposal' => proposalFile()]);

    expect($user->events()->sole())
        ->name->toBe('My Name')
        ->location->toBe('Bali')
        ->total_budget->toBe(1_000);
});

test('the AI is not called when the user already filled the required details', function () {
    Http::preventStrayRequests();
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('events.store'), [
        'name' => 'Typed',
        'event_date' => '2027-03-01',
        'total_budget' => 5_000_000,
        'proposal' => proposalFile(),
    ])->assertSessionHasNoErrors();

    expect($user->events()->count())->toBe(1);
});

test('invalid values from the AI are dropped and reported as missing', function () {
    Http::fake([geminiEndpoint() => Http::response(geminiResponse([
        'name' => 'Fest',
        'event_date' => '1 March',
        'location' => null,
        'total_budget' => -5,
        'description' => null,
    ]))]);
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('events.store'), ['proposal' => proposalFile()])
        ->assertSessionHasErrors(['event_date', 'total_budget'])
        ->assertSessionDoesntHaveErrors('name');

    expect($user->events()->count())->toBe(0);
});

test('a Gemini failure asks the user to fill the details manually', function () {
    Http::fake([geminiEndpoint() => Http::response([], 503)]);

    $this->actingAs(User::factory()->create())
        ->post(route('events.store'), ['proposal' => proposalFile()])
        ->assertSessionHasErrors('proposal');
});

test('without a proposal the core details are still required', function () {
    $this->actingAs(User::factory()->create())
        ->post(route('events.store'), [])
        ->assertSessionHasErrors(['name', 'event_date', 'total_budget']);
});

test('updating an event still requires the core details', function () {
    $event = Event::factory()->create();

    $this->actingAs($event->user)
        ->put(route('events.update', $event), ['name' => '', 'event_date' => '', 'total_budget' => ''])
        ->assertSessionHasErrors(['name', 'event_date', 'total_budget']);
});

test('the proposal pdf is sent to Gemini for extraction', function () {
    Http::fake([geminiEndpoint() => Http::response(geminiResponse([
        'name' => 'Fest', 'event_date' => '2027-03-01', 'location' => null, 'total_budget' => 1_000_000, 'description' => null,
    ]))]);

    $this->actingAs(User::factory()->create())->post(route('events.store'), ['proposal' => proposalFile()]);

    Http::assertSent(fn (Request $request) => ($request['contents'][0]['parts'][0]['inlineData']['mimeType'] ?? null) === 'application/pdf');
});
