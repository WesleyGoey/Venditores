<?php

use App\Enums\EventStatus;
use App\Models\Event;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

describe('index', function () {
    test('guests are redirected to the login page', function () {
        $this->get(route('events.index'))->assertRedirect(route('login'));
    });

    test('unverified users are sent to verify their email', function () {
        $this->actingAs(User::factory()->unverified()->create())
            ->get(route('events.index'))
            ->assertRedirect(route('verification.notice'));
    });

    test('it lists only the events of the signed in user', function () {
        $user = User::factory()->create();
        $ownEvent = Event::factory()->for($user)->create();
        Event::factory()->create();

        $this->actingAs($user)
            ->get(route('events.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('events/index')
                ->has('events', 1)
                ->where('events.0.id', $ownEvent->id));
    });
});

describe('store', function () {
    test('it creates a draft event and stores the proposal pdf', function () {
        Storage::fake('local');
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('events.store'), [
            'name' => 'Tech Fest',
            'event_date' => '2027-03-01',
            'location' => 'Surabaya',
            'total_budget' => 150_000_000,
            'description' => 'Annual tech festival',
            'proposal' => UploadedFile::fake()->create('proposal.pdf', 200, 'application/pdf'),
        ]);

        $event = $user->events()->sole();
        $response->assertRedirect(route('events.show', $event));

        expect($event)
            ->name->toBe('Tech Fest')
            ->total_budget->toBe(150_000_000)
            ->status->toBe(EventStatus::Draft)
            ->proposal_original_name->toBe('proposal.pdf');
        Storage::disk('local')->assertExists($event->proposal_path);
    });

    test('it rejects missing required fields', function () {
        $this->actingAs(User::factory()->create())
            ->post(route('events.store'), [])
            ->assertSessionHasErrors(['name', 'event_date', 'total_budget']);
    });

    test('it rejects a proposal that is not a pdf', function () {
        $this->actingAs(User::factory()->create())
            ->post(route('events.store'), [
                'name' => 'Tech Fest',
                'event_date' => '2027-03-01',
                'total_budget' => 1_000_000,
                'proposal' => UploadedFile::fake()->image('poster.png'),
            ])
            ->assertSessionHasErrors(['proposal' => 'The proposal field must be a file of type: pdf.']);
    });
});

describe('show', function () {
    test('it shows the event with its risk assessment', function () {
        $this->freezeTime();
        $event = Event::factory()->inDays(20)->create();

        $this->actingAs($event->user)
            ->get(route('events.show', $event))
            ->assertInertia(fn (Assert $page) => $page
                ->component('events/show')
                ->where('event.id', $event->id)
                ->where('risk.level', 'urgent')
                ->where('risk.days_remaining', 20)
                ->missing('event.proposal_path'));
    });

    test('other users get 404 for an event they do not own', function () {
        $event = Event::factory()->create();

        $this->actingAs(User::factory()->create())
            ->get(route('events.show', $event))
            ->assertNotFound();
    });
});

describe('update', function () {
    test('it replaces the proposal and deletes the old file', function () {
        Storage::fake('local');
        Storage::disk('local')->put('proposals/old.pdf', 'old');
        $event = Event::factory()->withProposal('proposals/old.pdf')->create();

        $this->actingAs($event->user)
            ->post(route('events.update', $event), [
                '_method' => 'put',
                'name' => 'Renamed event',
                'event_date' => '2027-05-01',
                'total_budget' => 5_000_000,
                'proposal' => UploadedFile::fake()->create('new.pdf', 100, 'application/pdf'),
            ])
            ->assertRedirect(route('events.show', $event));

        $event->refresh();
        expect($event->name)->toBe('Renamed event')
            ->and($event->proposal_original_name)->toBe('new.pdf');
        Storage::disk('local')->assertMissing('proposals/old.pdf');
        Storage::disk('local')->assertExists($event->proposal_path);
    });

    test('other users cannot update the event', function () {
        $event = Event::factory()->create(['name' => 'Original']);

        $this->actingAs(User::factory()->create())
            ->put(route('events.update', $event), [
                'name' => 'Hijacked',
                'event_date' => '2027-05-01',
                'total_budget' => 1,
            ])
            ->assertNotFound();

        expect($event->refresh()->name)->toBe('Original');
    });
});

describe('destroy', function () {
    test('it deletes the event and its proposal file', function () {
        Storage::fake('local');
        Storage::disk('local')->put('proposals/a.pdf', 'pdf');
        $event = Event::factory()->withProposal('proposals/a.pdf')->create();

        $this->actingAs($event->user)
            ->delete(route('events.destroy', $event))
            ->assertRedirect(route('events.index'));

        $this->assertModelMissing($event);
        Storage::disk('local')->assertMissing('proposals/a.pdf');
    });
});

describe('proposal', function () {
    test('the owner can view the proposal pdf', function () {
        Storage::fake('local');
        Storage::disk('local')->put('proposals/a.pdf', '%PDF-1.4');
        $event = Event::factory()->withProposal('proposals/a.pdf')->create();

        $this->actingAs($event->user)
            ->get(route('events.proposal', $event))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');
    });

    test('it returns 404 when the event has no proposal', function () {
        $event = Event::factory()->create();

        $this->actingAs($event->user)
            ->get(route('events.proposal', $event))
            ->assertNotFound();
    });
});

describe('completion', function () {
    test('it marks the event as completed and can reopen it', function () {
        $event = Event::factory()->analyzed()->create();

        $this->actingAs($event->user)->post(route('events.completion.store', $event));
        expect($event->refresh()->status)->toBe(EventStatus::Completed);

        $this->actingAs($event->user)->delete(route('events.completion.destroy', $event));
        expect($event->refresh()->status)->toBe(EventStatus::Analyzed);
    });
});
