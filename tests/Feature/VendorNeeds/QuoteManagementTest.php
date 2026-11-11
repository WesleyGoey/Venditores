<?php


use App\Enums\ProcurementStatus;
use App\Enums\QuoteStatus;
use App\Models\Quote;
use App\Models\User;
use App\Models\VendorNeed;


test('adding a quote records it and moves the need to quoted', function () {
    $need = VendorNeed::factory()->create(['procurement_status' => ProcurementStatus::Searching]);


    $this->actingAs($need->event->user)
        ->post(route('events.vendor-needs.quotes.store', [$need->event, $need]), [
            'vendor_name' => 'PT Suara Jaya',
            'vendor_contact' => '0812000000',
            'price' => 9_000_000,
            'notes' => 'Includes operator',
        ])
        ->assertSessionHasNoErrors();


    expect($need->quotes()->sole())
        ->vendor_name->toBe('PT Suara Jaya')
        ->price->toBe(9_000_000)
        ->status->toBe(QuoteStatus::Pending)
        ->and($need->refresh()->procurement_status)->toBe(ProcurementStatus::Quoted);
});


test('adding a quote does not move a need that already has a deal', function () {
    $need = VendorNeed::factory()->create(['procurement_status' => ProcurementStatus::Deal]);


    $this->actingAs($need->event->user)
        ->post(route('events.vendor-needs.quotes.store', [$need->event, $need]), [
            'vendor_name' => 'Backup vendor',
            'price' => 1_000_000,
        ]);


    expect($need->refresh()->procurement_status)->toBe(ProcurementStatus::Deal);
});


test('it rejects a quote without vendor name or price', function () {
    $need = VendorNeed::factory()->create();


    $this->actingAs($need->event->user)
        ->post(route('events.vendor-needs.quotes.store', [$need->event, $need]), [])
        ->assertSessionHasErrors(['vendor_name', 'price']);
});


test('accepting a quote marks the need as a deal', function () {
    $quote = Quote::factory()->create();
    $need = $quote->vendorNeed;


    $this->actingAs($need->event->user)
        ->patch(route('events.vendor-needs.quotes.update', [$need->event, $need, $quote]), ['status' => 'accepted'])
        ->assertSessionHasNoErrors();


    expect($quote->refresh()->status)->toBe(QuoteStatus::Accepted)
        ->and($need->refresh()->procurement_status)->toBe(ProcurementStatus::Deal);
});


test('changing the price of a scored quote recalculates its match score', function () {
    $need = VendorNeed::factory()->create(['allocated_budget' => 10_000_000]);
    $quote = Quote::factory()->for($need)->create([
        'price' => 10_000_000,
        'spec_score' => 70,
        'budget_score' => 100,
        'match_score' => 82,
    ]);


    $this->actingAs($need->event->user)
        ->patch(route('events.vendor-needs.quotes.update', [$need->event, $need, $quote]), ['price' => 11_000_000]);


    expect($quote->refresh())
        ->budget_score->toBe(80)
        ->match_score->toBe(74);
});


test('it returns 404 for a quote of a different need', function () {
    $quote = Quote::factory()->create();
    $otherNeed = VendorNeed::factory()->for($quote->vendorNeed->event)->create();


    $this->actingAs($otherNeed->event->user)
        ->delete(route('events.vendor-needs.quotes.destroy', [$otherNeed->event, $otherNeed, $quote]))
        ->assertNotFound();


    $this->assertModelExists($quote);
});


test('other users cannot add quotes', function () {
    $need = VendorNeed::factory()->create();


    $this->actingAs(User::factory()->create())
        ->post(route('events.vendor-needs.quotes.store', [$need->event, $need]), [
            'vendor_name' => 'Intruder',
            'price' => 1,
        ])
        ->assertNotFound();


    expect($need->quotes()->count())->toBe(0);
});


test('it deletes a quote', function () {
    $quote = Quote::factory()->create();
    $need = $quote->vendorNeed;


    $this->actingAs($need->event->user)
        ->delete(route('events.vendor-needs.quotes.destroy', [$need->event, $need, $quote]));


    $this->assertModelMissing($quote);
});


test('un-choosing the accepted quote steps the need back to quoted', function () {
    $quote = Quote::factory()->create(['status' => QuoteStatus::Accepted]);
    $need = $quote->vendorNeed;
    $need->update(['procurement_status' => ProcurementStatus::Deal]);


    $this->actingAs($need->event->user)
        ->patch(route('events.vendor-needs.quotes.update', [$need->event, $need, $quote]), ['status' => 'pending']);


    expect($need->refresh()->procurement_status)->toBe(ProcurementStatus::Quoted);
});


test('declining the last active quote steps the need back to searching', function () {
    $quote = Quote::factory()->create(['status' => QuoteStatus::Pending]);
    $need = $quote->vendorNeed;
    $need->update(['procurement_status' => ProcurementStatus::Quoted]);


    $this->actingAs($need->event->user)
        ->patch(route('events.vendor-needs.quotes.update', [$need->event, $need, $quote]), ['status' => 'rejected']);


    expect($need->refresh()->procurement_status)->toBe(ProcurementStatus::Searching);
});


test('deleting the chosen quote steps a deal back to searching when nothing else is left', function () {
    $quote = Quote::factory()->create(['status' => QuoteStatus::Accepted]);
    $need = $quote->vendorNeed;
    $need->update(['procurement_status' => ProcurementStatus::Deal]);


    $this->actingAs($need->event->user)
        ->delete(route('events.vendor-needs.quotes.destroy', [$need->event, $need, $quote]));


    expect($need->refresh()->procurement_status)->toBe(ProcurementStatus::Searching);
});


test('a paid need is never stepped back', function () {
    $quote = Quote::factory()->create(['status' => QuoteStatus::Accepted]);
    $need = $quote->vendorNeed;
    $need->update(['procurement_status' => ProcurementStatus::Paid]);


    $this->actingAs($need->event->user)
        ->delete(route('events.vendor-needs.quotes.destroy', [$need->event, $need, $quote]));


    expect($need->refresh()->procurement_status)->toBe(ProcurementStatus::Paid);
});
