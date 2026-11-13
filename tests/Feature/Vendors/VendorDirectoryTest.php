<?php

use App\Enums\QuoteStatus;
use App\Models\Event;
use App\Models\Quote;
use App\Models\RecommendedVendor;
use App\Models\User;
use App\Models\VendorNeed;
use Inertia\Testing\AssertableInertia as Assert;

$vendorData = fn (array $overrides = []): array => [
    'name' => 'Dapur Nusantara',
    'category' => 'Catering',
    'description' => 'Lunch boxes and buffet.',
    'contact' => '0812-0000-0001',
    'website' => 'https://example.com',
    'price_estimate' => 40_000_000,
    ...$overrides,
];

describe('directory', function () {
    test('guests are redirected to the login page', function () {
        $this->get(route('vendors.index'))->assertRedirect(route('login'));
    });

    test('users see the recommended vendors with their rating but not the user vendors', function () {
        $vendor = RecommendedVendor::factory()->create();
        $vendor->reviews()->create(['user_id' => User::factory()->create()->id, 'rating' => 4]);
        $vendor->reviews()->create(['user_id' => User::factory()->create()->id, 'rating' => 5]);
        Quote::factory()->create(['vendor_name' => 'Secret Vendor']);

        $this->actingAs(User::factory()->create())
            ->get(route('vendors.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('vendors/index')
                ->has('vendors', 1)
                ->where('vendors.0.rating', 4.5)
                ->where('vendors.0.reviews_count', 2)
                ->where('userVendors', null));
    });

    test('the admin also sees the vendors users added, separate from the recommended list', function () {
        RecommendedVendor::factory()->create();
        $need = VendorNeed::factory()->create(['category' => 'Venue']);
        Quote::factory()->for($need)->create(['vendor_name' => 'User Added Hall']);

        $this->actingAs(User::factory()->admin()->create())
            ->get(route('vendors.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('vendors', 1)
                ->has('userVendors', 1)
                ->where('userVendors.0.name', 'User Added Hall')
                ->where('userVendors.0.category', 'Venue')
                ->where('userVendors.0.user', $need->event->user->name));
    });
});

describe('managing', function () use ($vendorData) {
    test('the admin can add, edit and delete a recommended vendor', function () use ($vendorData) {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->post(route('vendors.store'), $vendorData())->assertSessionHas('success');
        $vendor = RecommendedVendor::sole();
        expect($vendor->name)->toBe('Dapur Nusantara');

        $this->actingAs($admin)->patch(route('vendors.update', $vendor), $vendorData(['name' => 'Renamed']))->assertSessionHas('success');
        expect($vendor->refresh()->name)->toBe('Renamed');

        $this->actingAs($admin)->delete(route('vendors.destroy', $vendor))->assertSessionHas('success');
        expect(RecommendedVendor::count())->toBe(0);
    });

    test('regular users cannot change the recommended list', function () use ($vendorData) {
        $user = User::factory()->create();
        $vendor = RecommendedVendor::factory()->create();

        $this->actingAs($user)->post(route('vendors.store'), $vendorData())->assertForbidden();
        $this->actingAs($user)->patch(route('vendors.update', $vendor), $vendorData())->assertForbidden();
        $this->actingAs($user)->delete(route('vendors.destroy', $vendor))->assertForbidden();

        expect(RecommendedVendor::count())->toBe(1);
    });

    test('name and category are required and the website must be a web address', function () use ($vendorData) {
        $this->actingAs(User::factory()->admin()->create())
            ->post(route('vendors.store'), $vendorData(['name' => '', 'category' => '', 'website' => 'javascript:alert(1)']))
            ->assertSessionHasErrors(['name', 'category', 'website']);
    });
});

describe('reviews', function () {
    test('a user can review a vendor and replace the review later', function () {
        $user = User::factory()->create();
        $vendor = RecommendedVendor::factory()->create();

        $this->actingAs($user)->put(route('vendors.review.store', $vendor), ['rating' => 3, 'comment' => 'Okay'])->assertSessionHas('success');
        $this->actingAs($user)->put(route('vendors.review.store', $vendor), ['rating' => 5, 'comment' => 'Great'])->assertSessionHas('success');

        expect($vendor->reviews()->count())->toBe(1)
            ->and($vendor->reviews()->sole())->rating->toBe(5)->comment->toBe('Great');
    });

    test('the rating must be 1 to 5', function (mixed $rating) {
        $this->actingAs(User::factory()->create())
            ->put(route('vendors.review.store', RecommendedVendor::factory()->create()), ['rating' => $rating])
            ->assertSessionHasErrors('rating');
    })->with([0, 6, 'abc', null]);

    test('a user can delete only their own review', function () {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $vendor = RecommendedVendor::factory()->create();
        $vendor->reviews()->create(['user_id' => $user->id, 'rating' => 4]);
        $vendor->reviews()->create(['user_id' => $other->id, 'rating' => 2]);

        $this->actingAs($user)->delete(route('vendors.review.destroy', $vendor))->assertSessionHas('success');

        expect($vendor->reviews()->pluck('user_id')->all())->toBe([$other->id]);
    });
});

describe('picking a vendor on a vendor need', function () {
    test('all recommended vendors are offered and the ones for the same category are flagged', function () {
        $need = VendorNeed::factory()->create(['category' => 'Catering & Snacks']);
        RecommendedVendor::factory()->create(['name' => 'Match', 'category' => 'catering']);
        RecommendedVendor::factory()->create(['name' => 'Other', 'category' => 'Venue']);

        $this->actingAs($need->event->user)
            ->get(route('events.vendor-needs.show', [$need->event, $need]))
            ->assertInertia(fn (Assert $page) => $page
                ->has('recommendedVendors', 2)
                ->where('recommendedVendors.0.name', 'Match')
                ->where('recommendedVendors.0.matches_need', true)
                ->where('recommendedVendors.1.matches_need', false));
    });

    test('vendors the user chose before are offered again, once each and only their own', function () {
        $user = User::factory()->create();
        $event = Event::factory()->for($user)->create(['name' => 'Last Year Fest']);
        $oldNeed = VendorNeed::factory()->for($event)->create(['category' => 'Catering']);
        Quote::factory()->for($oldNeed)->create(['vendor_name' => 'Dapur A', 'status' => QuoteStatus::Accepted, 'price' => 5_000_000]);
        Quote::factory()->for($oldNeed)->create(['vendor_name' => 'Dapur Declined', 'status' => QuoteStatus::Rejected]);
        Quote::factory()->for($oldNeed)->create(['vendor_name' => 'Dapur Pending', 'status' => QuoteStatus::Pending]);
        $otherNeed = VendorNeed::factory()->create(['category' => 'Catering']);
        Quote::factory()->for($otherNeed)->create(['vendor_name' => "Someone Else's", 'status' => QuoteStatus::Accepted]);
        $thisNeed = VendorNeed::factory()->for(Event::factory()->for($user)->create())->create(['category' => 'Catering']);

        $this->actingAs($user)
            ->get(route('events.vendor-needs.show', [$thisNeed->event, $thisNeed]))
            ->assertInertia(fn (Assert $page) => $page
                ->has('usedVendors', 1)
                ->where('usedVendors.0.name', 'Dapur A')
                ->where('usedVendors.0.event', 'Last Year Fest')
                ->where('usedVendors.0.price', 5_000_000));
    });
});

describe('admin', function () {
    test('an admin is sent to the vendors page instead of events, dashboard and history', function (string $route) {
        $this->actingAs(User::factory()->admin()->create())->get(route($route))->assertRedirect(route('vendors.index'));
    })->with(['dashboard', 'events.index', 'events.create', 'history']);

    test('an admin cannot review vendors', function () {
        $vendor = RecommendedVendor::factory()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->put(route('vendors.review.store', $vendor), ['rating' => 5])
            ->assertForbidden();

        expect($vendor->reviews()->count())->toBe(0);
    });
});

describe('history', function () {
    test('it lists the events of the user, newest first, with the vendors chosen for each', function () {
        $user = User::factory()->create();
        $event = Event::factory()->for($user)->create(['name' => 'Tech Fest', 'event_date' => '2027-06-01']);
        $need = VendorNeed::factory()->for($event)->create(['category' => 'Venue']);
        Quote::factory()->for($need)->create(['vendor_name' => 'Grand Hall', 'status' => QuoteStatus::Accepted]);
        Quote::factory()->for($need)->create(['vendor_name' => 'Small Hall', 'status' => QuoteStatus::Rejected]);
        Event::factory()->for($user)->create(['name' => 'Empty Event', 'event_date' => '2026-01-01']);
        Event::factory()->create(['name' => 'Not Mine']);

        $this->actingAs($user)
            ->get(route('history'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('history/index')
                ->has('events', 2)
                ->where('events.0.name', 'Tech Fest')
                ->has('events.0.vendors', 1)
                ->where('events.0.vendors.0.name', 'Grand Hall')
                ->where('events.0.vendors.0.category', 'Venue')
                ->where('events.1.name', 'Empty Event')
                ->has('events.1.vendors', 0));
    });
});
