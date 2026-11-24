<?php

use App\Models\Event;
use App\Models\Quote;
use App\Models\RecommendedVendor;
use App\Models\User;
use App\Models\VendorNeed;
use App\Models\VendorReview;
use App\Services\RealtimeNotifier;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

function enableRealtime(): void
{
    config([
        'services.supabase.realtime' => true,
        'services.supabase.publishable_key' => 'sb_publishable_testing',
    ]);
}

/**
 * Everything that was broadcast, as the topics of each request.
 *
 * @return list<list<string>>
 */
function broadcastTopics(): array
{
    return Http::recorded(fn (Request $request): bool => str_ends_with($request->url(), '/realtime/v1/api/broadcast'))
        ->map(fn (array $pair): array => collect($pair[0]['messages'])->pluck('topic')->all())
        ->values()
        ->all();
}

function topicFor(string $name): string
{
    return 'rt-'.substr(hash_hmac('sha256', $name, (string) config('app.key')), 0, 32);
}

beforeEach(function () {
    Http::preventStrayRequests();
});

describe('what the browser is told', function () {
    test('nothing is shared while realtime is off', function () {
        $this->actingAs(User::factory()->create())
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page->where('realtime', null));
    });

    test('a user gets the public key and signed topics for their own events and the vendors', function () {
        enableRealtime();
        $user = User::factory()->create();

        $this->actingAs($user)->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page
            ->where('realtime.url', 'https://supabase.test')
            ->where('realtime.key', 'sb_publishable_testing')
            ->where('realtime.topics', [topicFor("user.{$user->id}"), topicFor('vendors')]));
    });

    test('an admin gets the vendors and admins topics, and the secret key is never shared', function () {
        enableRealtime();

        $this->actingAs(User::factory()->admin()->create())->get(route('vendors.index'))->assertInertia(fn (Assert $page) => $page
            ->where('realtime.topics', [topicFor('vendors'), topicFor('admins')])
            ->missing('realtime.secret_key'));
    });

    test('topics cannot be guessed from the user id', function () {
        enableRealtime();
        $user = User::factory()->create();

        $topics = app(RealtimeNotifier::class)->connectionFor($user)['topics'];

        expect($topics[0])->not->toContain("user.{$user->id}")->and($topics[0])->toStartWith('rt-')->and($topics[0])->not->toBe($topics[1]);
    });
});

describe('what triggers a ping', function () {
    beforeEach(function () {
        enableRealtime();
        Http::fake(['supabase.test/realtime/*' => Http::response('', 202)]);
    });

    test('changing a vendor need pings its owner once, however many rows changed', function () {
        $user = User::factory()->create();
        $event = Event::factory()->for($user)->create();
        $need = VendorNeed::factory()->for($event)->create();
        Http::fake(['supabase.test/realtime/*' => Http::response('', 202)]);

        $this->actingAs($user)->patch(route('events.vendor-needs.update', [$event, $need]), [
            'category' => 'Venue',
            'specification' => 'A hall',
            'allocated_budget' => 1_000_000,
            'is_vital' => false,
        ]);
        app(RealtimeNotifier::class)->flush();

        expect(broadcastTopics())->toBe([[topicFor("user.{$user->id}")]]);
    });

    test('a new quote pings the owner of the event and the admins', function () {
        $user = User::factory()->create();
        $need = VendorNeed::factory()->for(Event::factory()->for($user)->create())->create();
        Http::fake(['supabase.test/realtime/*' => Http::response('', 202)]);

        Quote::factory()->for($need)->create();
        app(RealtimeNotifier::class)->flush();

        expect(broadcastTopics())->toBe([[topicFor("user.{$user->id}"), topicFor('admins')]]);
    });

    test('changing a recommended vendor or a review pings everyone through the vendors topic', function () {
        $vendor = RecommendedVendor::factory()->create();
        app(RealtimeNotifier::class)->flush();
        Http::fake(['supabase.test/realtime/*' => Http::response('', 202)]);

        VendorReview::create(['recommended_vendor_id' => $vendor->id, 'user_id' => User::factory()->create()->id, 'rating' => 5]);
        app(RealtimeNotifier::class)->flush();

        expect(broadcastTopics())->toBe([[topicFor('vendors')]]);
    });

    test('the ping carries no data', function () {
        Event::factory()->create(['name' => 'Secret Launch']);
        app(RealtimeNotifier::class)->flush();

        Http::assertSent(fn (Request $request): bool => $request->hasHeader('apikey', 'sb_secret_testing')
            && $request['messages'][0]['event'] === 'changed'
            && (array) $request['messages'][0]['payload'] === []
            && $request['messages'][0]['private'] === false
            && ! str_contains($request->body(), 'Secret Launch'));
    });

    test('nothing is sent while realtime is off', function () {
        config(['services.supabase.realtime' => false]);

        Event::factory()->create();
        app(RealtimeNotifier::class)->flush();

        Http::assertNothingSent();
    });

    test('a failing broadcast never breaks saving', function () {
        Http::fake(['supabase.test/realtime/*' => Http::response('boom', 500)]);

        $event = Event::factory()->create(['name' => 'Still Saved']);
        app(RealtimeNotifier::class)->flush();

        expect(Event::find($event->id)->name)->toBe('Still Saved');
    });
});
