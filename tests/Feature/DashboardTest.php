<?php

use App\Enums\EventStatus;
use App\Enums\ProcurementStatus;
use App\Models\Event;
use App\Models\Quote;
use App\Models\User;
use App\Models\VendorNeed;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $this->get('/dashboard')->assertRedirect('/login');
});

test('authenticated users can visit the dashboard', function () {
    $this->actingAs($user = User::factory()->create());

    $this->get('/dashboard')->assertOk();
});

test('stats and status counts only include the user\'s own data', function () {
    $user = User::factory()->create();
    $event = Event::factory()->for($user)->analyzed()->create(['total_budget' => 50_000_000]);
    Event::factory()->for($user)->create(['total_budget' => 10_000_000]);
    Quote::factory()->for(VendorNeed::factory()->for($event)->create(['procurement_status' => ProcurementStatus::Quoted]))->create();
    Quote::factory()->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('stats', ['events' => 2, 'vendor_needs' => 1, 'quotes' => 1, 'total_budget' => 60_000_000])
            ->where('eventStatusCounts.0', ['value' => 'draft', 'label' => 'Draft', 'count' => 1])
            ->where('eventStatusCounts.1', ['value' => 'analyzed', 'label' => 'Analyzed', 'count' => 1])
            ->where('procurementStatusCounts.2', ['value' => 'quoted', 'label' => 'Comparing offers', 'count' => 1]));
});

test('critical needs are those without quotes or with only rejected quotes', function () {
    $user = User::factory()->create();
    $event = Event::factory()->for($user)->create();
    $withoutQuotes = VendorNeed::factory()->for($event)->create();
    $allRejected = VendorNeed::factory()->for($event)->create();
    Quote::factory()->for($allRejected)->rejected()->create();
    $covered = VendorNeed::factory()->for($event)->create();
    Quote::factory()->for($covered)->rejected()->create();
    Quote::factory()->for($covered)->create();
    VendorNeed::factory()->for(Event::factory()->for($user)->create(['status' => EventStatus::Completed]))->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('criticalNeeds', 2)
            ->where('criticalNeeds', fn ($needs) => collect($needs)->pluck('id')->sort()->values()->all() === [$withoutQuotes->id, $allRejected->id]));
});

test('the warning list shows analyzed events within 60 days, soonest first', function () {
    $this->freezeTime();
    $user = User::factory()->create();
    $warning = Event::factory()->for($user)->analyzed()->inDays(50)->create();
    $urgent = Event::factory()->for($user)->analyzed()->inDays(10)->create();
    VendorNeed::factory()->for($urgent)->vital()->create(['category' => 'Venue']);
    VendorNeed::factory()->for($urgent)->vital()->create(['category' => 'Catering', 'procurement_status' => ProcurementStatus::Paid]);
    Event::factory()->for($user)->analyzed()->inDays(90)->create();
    Event::factory()->for($user)->inDays(5)->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('warnings', 2)
            ->where('warnings.0.event.id', $urgent->id)
            ->where('warnings.0.level', 'urgent')
            ->where('warnings.0.days_remaining', 10)
            ->where('warnings.0.unsecured_vital_needs', ['Venue'])
            ->where('warnings.1.event.id', $warning->id)
            ->where('warnings.1.level', 'warning'));
});
