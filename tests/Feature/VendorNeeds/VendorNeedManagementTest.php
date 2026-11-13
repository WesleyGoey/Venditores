<?php

use App\Enums\ProcurementStatus;
use App\Models\Event;
use App\Models\User;
use App\Models\VendorNeed;
use Inertia\Testing\AssertableInertia as Assert;

test('it adds a vendor need to the event', function () {
    $event = Event::factory()->create();

    $this->actingAs($event->user)
        ->post(route('events.vendor-needs.store', $event), [
            'category' => 'Sound System',
            'specification' => '2x 1000W speakers',
            'allocated_budget' => 7_500_000,
            'is_vital' => true,
        ])
        ->assertSessionHasNoErrors();

    expect($event->vendorNeeds()->sole())
        ->category->toBe('Sound System')
        ->allocated_budget->toBe(7_500_000)
        ->is_vital->toBeTrue()
        ->procurement_status->toBe(ProcurementStatus::Drafting);
});

test('it rejects a vendor need without category or budget', function () {
    $event = Event::factory()->create();

    $this->actingAs($event->user)
        ->post(route('events.vendor-needs.store', $event), [])
        ->assertSessionHasErrors(['category', 'allocated_budget']);
});

test('it updates only the procurement status', function () {
    $need = VendorNeed::factory()->create(['category' => 'Venue']);

    $this->actingAs($need->event->user)
        ->patch(route('events.vendor-needs.update', [$need->event, $need]), ['procurement_status' => 'paid'])
        ->assertSessionHasNoErrors();

    expect($need->refresh())
        ->procurement_status->toBe(ProcurementStatus::Paid)
        ->category->toBe('Venue');
});

test('it rejects an unknown procurement status', function () {
    $need = VendorNeed::factory()->create();

    $this->actingAs($need->event->user)
        ->patch(route('events.vendor-needs.update', [$need->event, $need]), ['procurement_status' => 'shipped'])
        ->assertSessionHasErrors('procurement_status');
});

test('changing the budget manually clears the ai basis points', function () {
    $need = VendorNeed::factory()->create(['allocation_basis_points' => 2_500]);

    $this->actingAs($need->event->user)
        ->patch(route('events.vendor-needs.update', [$need->event, $need]), ['allocated_budget' => 1_000_000]);

    expect($need->refresh()->allocation_basis_points)->toBeNull();
});

test('it shows the vendor need with its quotes', function () {
    $need = VendorNeed::factory()->hasQuotes(2)->create();

    $this->actingAs($need->event->user)
        ->get(route('events.vendor-needs.show', [$need->event, $need]))
        ->assertInertia(fn (Assert $page) => $page
            ->component('vendor-needs/show')
            ->where('vendorNeed.id', $need->id)
            ->has('vendorNeed.quotes', 2));
});

test('it returns 404 when the need belongs to a different event', function () {
    $need = VendorNeed::factory()->create();
    $otherEvent = Event::factory()->for($need->event->user)->create();

    $this->actingAs($need->event->user)
        ->get(route('events.vendor-needs.show', [$otherEvent, $need]))
        ->assertNotFound();
});

test('other users cannot change vendor needs', function () {
    $need = VendorNeed::factory()->create();

    $this->actingAs(User::factory()->create())
        ->patch(route('events.vendor-needs.update', [$need->event, $need]), ['procurement_status' => 'paid'])
        ->assertNotFound();

    expect($need->refresh()->procurement_status)->toBe(ProcurementStatus::Drafting);
});

test('it deletes a vendor need', function () {
    $need = VendorNeed::factory()->create();

    $this->actingAs($need->event->user)
        ->delete(route('events.vendor-needs.destroy', [$need->event, $need]))
        ->assertRedirect(route('events.show', $need->event));

    $this->assertModelMissing($need);
});
