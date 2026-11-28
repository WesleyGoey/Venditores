<?php

use App\Enums\VendorStatus;
use App\Models\Event;
use App\Models\RecommendedVendor;
use App\Models\User;
use App\Models\VendorNeed;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

$listing = fn(array $overrides = []): array => [
    'name' => 'Dapur Nusantara',
    'category' => 'Catering',
    'description' => 'Lunch boxes and buffet.',
    'contact' => '0812-0000-0001',
    'website' => 'https://example.com',
    'price_estimate' => 40_000,
    ...$overrides,
];

describe('signing up', function () {
    test('a vendor account is created when the account type is vendor', function () {
        Http::preventStrayRequests();
        Http::fake(['supabase.test/auth/v1/signup*' => Http::response(['id' => '7f0c3a4e-1111-4b2c-9d3e-5f6a7b8c9d0e'])]);

        $this->post('/register', [
            'name' => 'Dapur Nusantara',
            'email' => 'dapur@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'account_type' => 'vendor',
        ]);

        expect(User::where('email', 'dapur@example.com')->sole()->is_vendor)->toBeTrue();
        Http::assertSent(fn(Request $request): bool => str_contains($request->url(), 'signup'));
    });

    test('an account is a regular user unless it asks to be a vendor', function () {
        Http::preventStrayRequests();
        Http::fake(['supabase.test/auth/v1/signup*' => Http::response(['id' => '7f0c3a4e-1111-4b2c-9d3e-5f6a7b8c9d0e'])]);

        $this->post('/register', [
            'name' => 'Committee Member',
            'email' => 'member@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        expect(User::where('email', 'member@example.com')->sole()->is_vendor)->toBeFalse();
    });

    test('an unknown account type is rejected', function () {
        $this->post('/register', [
            'name' => 'Someone',
            'email' => 'someone@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'account_type' => 'admin',
        ])->assertSessionHasErrors('account_type');
    });
});

describe('listing a vendor', function () use ($listing) {
    test('a vendor account lists a vendor that waits for the admin', function () use ($listing) {
        $owner = User::factory()->vendor()->create();

        $this->actingAs($owner)
            ->post(route('my-vendors.store'), $listing())
            ->assertRedirect();

        $vendor = RecommendedVendor::sole();
        expect($vendor->user_id)->toBe($owner->id)
            ->and($vendor->status)->toBe(VendorStatus::Pending);
    });

    test('the status cannot be chosen by the vendor account', function () use ($listing) {
        $this->actingAs(User::factory()->vendor()->create())
            ->post(route('my-vendors.store'), [...$listing(), 'status' => 'approved', 'user_id' => 999]);

        expect(RecommendedVendor::sole()->status)->toBe(VendorStatus::Pending);
    });

    test('regular users and the admin cannot list vendors through a vendor account', function () use ($listing) {
        $this->actingAs(User::factory()->create())->post(route('my-vendors.store'), $listing())->assertForbidden();
        $this->actingAs(User::factory()->admin()->create())->post(route('my-vendors.store'), $listing())->assertForbidden();

        expect(RecommendedVendor::count())->toBe(0);
    });

    test('editing a vendor sends it back to the admin and clears the old rejection', function () use ($listing) {
        $owner = User::factory()->vendor()->create();
        $vendor = RecommendedVendor::factory()->create([
            'user_id' => $owner->id,
            'status' => VendorStatus::Rejected,
            'admin_note' => 'No contact details.',
        ]);

        $this->actingAs($owner)
            ->patch(route('my-vendors.update', $vendor), $listing(['name' => 'Dapur Baru']))
            ->assertRedirect();

        expect($vendor->refresh())
            ->name->toBe('Dapur Baru')
            ->status->toBe(VendorStatus::Pending)
            ->admin_note->toBeNull();
    });

    test('an approved vendor leaves the user directory until the admin approves the change again', function () use ($listing) {
        $owner = User::factory()->vendor()->create();
        $vendor = RecommendedVendor::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($owner)->patch(route('my-vendors.update', $vendor), $listing());

        $this->actingAs(User::factory()->create())
            ->get(route('vendors.index'))
            ->assertInertia(fn(Assert $page) => $page->has('vendors', 0));
    });

    test('a vendor account cannot edit or delete another account\'s vendor', function () use ($listing) {
        $vendor = RecommendedVendor::factory()->pending()->create();
        $stranger = User::factory()->vendor()->create();

        $this->actingAs($stranger)->patch(route('my-vendors.update', $vendor), $listing())->assertNotFound();
        $this->actingAs($stranger)->delete(route('my-vendors.destroy', $vendor))->assertNotFound();

        expect($vendor->fresh())->not->toBeNull();
    });

    test('a vendor account can delete its own vendor', function () {
        $owner = User::factory()->vendor()->create();
        $vendor = RecommendedVendor::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($owner)->delete(route('my-vendors.destroy', $vendor))->assertRedirect();

        expect($vendor->fresh())->toBeNull();
    });
});

describe('what users see', function () {
    test('only approved vendors reach the directory and the vendor picker', function () {
        RecommendedVendor::factory()->create(['name' => 'Approved Hall']);
        RecommendedVendor::factory()->pending()->create(['name' => 'Waiting Hall']);
        RecommendedVendor::factory()->pending()->create(['name' => 'Rejected Hall', 'status' => VendorStatus::Rejected]);
        $need = VendorNeed::factory()->for(Event::factory())->create();

        $user = $need->event->user;

        $this->actingAs($user)
            ->get(route('vendors.index'))
            ->assertInertia(fn(Assert $page) => $page->has('vendors', 1)->where('vendors.0.name', 'Approved Hall'));

        $this->actingAs($user)
            ->get(route('events.vendor-needs.show', [$need->event, $need]))
            ->assertInertia(fn(Assert $page) => $page->has('recommendedVendors', 1)->where('recommendedVendors.0.name', 'Approved Hall'));
    });

    test('a vendor that is not approved cannot be reviewed', function () {
        $vendor = RecommendedVendor::factory()->pending()->create();

        $this->actingAs(User::factory()->create())
            ->put(route('vendors.review.store', $vendor), ['rating' => 5])
            ->assertNotFound();

        expect($vendor->reviews()->count())->toBe(0);
    });

    test('a vendor account cannot write reviews', function () {
        $vendor = RecommendedVendor::factory()->create();

        $this->actingAs(User::factory()->vendor()->create())
            ->put(route('vendors.review.store', $vendor), ['rating' => 5])
            ->assertForbidden();
    });

    test('vendor accounts are sent to their vendors instead of the committee screens', function () {
        $owner = User::factory()->vendor()->create();

        $this->actingAs($owner)->get(route('dashboard'))->assertRedirect(route('vendors.index'));
        $this->actingAs($owner)->get(route('events.index'))->assertRedirect(route('vendors.index'));
        $this->actingAs($owner)->get(route('history'))->assertRedirect(route('vendors.index'));
    });
});

describe('the vendor account page', function () {
    test('a vendor account sees only its own vendors, with status, note and reviews', function () {
        $owner = User::factory()->vendor()->create();
        $mine = RecommendedVendor::factory()->create(['user_id' => $owner->id, 'name' => 'Dapur Nusantara']);
        $mine->reviews()->create(['user_id' => User::factory()->create()->id, 'rating' => 4, 'comment' => 'Tasty.']);
        $mine->reviews()->create(['user_id' => User::factory()->create()->id, 'rating' => 5]);
        RecommendedVendor::factory()->create(['user_id' => $owner->id, 'status' => VendorStatus::Rejected, 'admin_note' => 'Add a contact.']);
        RecommendedVendor::factory()->create(['name' => 'Somebody Else']);

        $this->actingAs($owner)
            ->get(route('vendors.index'))
            ->assertInertia(fn(Assert $page) => $page
                ->component('vendors/mine')
                ->has('vendors', 2)
                ->where('vendors', fn($vendors) => collect($vendors)->pluck('name')->doesntContain('Somebody Else'))
                ->where('vendors', fn($vendors) => collect($vendors)->firstWhere('name', 'Dapur Nusantara')['rating'] === 4.5)
                ->where('vendors', fn($vendors) => collect($vendors)->firstWhere('name', 'Dapur Nusantara')['reviews_count'] === 2)
                ->where('vendors', fn($vendors) => collect($vendors)->contains('admin_note', 'Add a contact.')));
    });
});

describe('approval by the admin', function () {
    test('the admin sees the vendors waiting for approval', function () {
        RecommendedVendor::factory()->create();
        $waiting = RecommendedVendor::factory()->pending()->create();
        RecommendedVendor::factory()->pending()->create(['status' => VendorStatus::Rejected]);

        $this->actingAs(User::factory()->admin()->create())
            ->get(route('vendors.index'))
            ->assertInertia(fn(Assert $page) => $page
                ->has('vendors', 1)
                ->has('pendingVendors', 1)
                ->where('pendingVendors.0.id', $waiting->id)
                ->where('pendingVendors.0.owner', $waiting->owner->name));
    });

    test('regular users never receive the approval queue', function () {
        RecommendedVendor::factory()->pending()->create();

        $this->actingAs(User::factory()->create())
            ->get(route('vendors.index'))
            ->assertInertia(fn(Assert $page) => $page->where('pendingVendors', null));
    });

    test('approving a vendor shows it to users', function () {
        $vendor = RecommendedVendor::factory()->pending()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->patch(route('vendors.status.update', $vendor), ['status' => 'approved'])
            ->assertRedirect();

        expect($vendor->refresh()->status)->toBe(VendorStatus::Approved);

        $this->actingAs(User::factory()->create())
            ->get(route('vendors.index'))
            ->assertInertia(fn(Assert $page) => $page->has('vendors', 1));
    });

    test('rejecting needs a reason that the owner can read', function () {
        $vendor = RecommendedVendor::factory()->pending()->create();
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->patch(route('vendors.status.update', $vendor), ['status' => 'rejected'])
            ->assertSessionHasErrors('admin_note');

        $this->actingAs($admin)
            ->patch(route('vendors.status.update', $vendor), ['status' => 'rejected', 'admin_note' => 'No contact details.'])
            ->assertRedirect();

        expect($vendor->refresh())
            ->status->toBe(VendorStatus::Rejected)
            ->admin_note->toBe('No contact details.');
    });

    test('approving clears an earlier rejection note', function () {
        $vendor = RecommendedVendor::factory()->pending()->create(['status' => VendorStatus::Rejected, 'admin_note' => 'Old note.']);

        $this->actingAs(User::factory()->admin()->create())
            ->patch(route('vendors.status.update', $vendor), ['status' => 'approved', 'admin_note' => 'ignored']);

        expect($vendor->refresh()->admin_note)->toBeNull();
    });

    test('only the admin can approve', function () {
        $vendor = RecommendedVendor::factory()->pending()->create();

        $this->actingAs(User::factory()->create())->patch(route('vendors.status.update', $vendor), ['status' => 'approved'])->assertForbidden();
        $this->actingAs($vendor->owner)->patch(route('vendors.status.update', $vendor), ['status' => 'approved'])->assertForbidden();

        expect($vendor->refresh()->status)->toBe(VendorStatus::Pending);
    });
});

describe('telling vendors apart', function () {
    test('the admin is warned when a waiting vendor has the name of a recommended one', function () {
        RecommendedVendor::factory()->create(['name' => 'Dian Catering']);
        RecommendedVendor::factory()->pending()->create(['name' => '  dian catering ']);
        RecommendedVendor::factory()->pending()->create(['name' => 'Another Hall']);

        $this->actingAs(User::factory()->admin()->create())
            ->get(route('vendors.index'))
            ->assertInertia(fn(Assert $page) => $page
                ->where('pendingVendors.0.name', '  dian catering ')
                ->where('pendingVendors.0.already_listed', true)
                ->where('pendingVendors.1.already_listed', false));
    });

    test('only the admin sees which vendor account manages a recommended vendor', function () {
        $owner = User::factory()->vendor()->create(['name' => 'Budi Owner']);
        RecommendedVendor::factory()->create(['user_id' => $owner->id]);
        RecommendedVendor::factory()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->get(route('vendors.index'))
            ->assertInertia(fn(Assert $page) => $page
                ->where('vendors', fn($vendors) => collect($vendors)->pluck('owner')->filter()->values()->all() === ['Budi Owner']));

        $this->actingAs(User::factory()->create())
            ->get(route('vendors.index'))
            ->assertInertia(fn(Assert $page) => $page
                ->where('vendors', fn($vendors) => collect($vendors)->pluck('owner')->filter()->isEmpty()));
    });

    test('a vendor account never reads the reviews of another vendor that has the same name', function () {
        $owner = User::factory()->vendor()->create();
        RecommendedVendor::factory()->pending()->create(['user_id' => $owner->id, 'name' => 'Dian Catering']);
        $adminAdded = RecommendedVendor::factory()->create(['name' => 'Dian Catering']);
        $adminAdded->reviews()->create(['user_id' => User::factory()->create()->id, 'rating' => 5, 'comment' => 'Great.']);

        $this->actingAs($owner)
            ->get(route('vendors.index'))
            ->assertInertia(fn(Assert $page) => $page
                ->where('vendors.0.reviews_count', 0)
                ->where('vendors.0.rating', null)
                ->where('vendors.0.reviews', []));
    });
});

describe('handing a vendor to a vendor account', function () {
    test('the admin links a vendor to a vendor account by email, and the owner then sees it', function () {
        $vendor = RecommendedVendor::factory()->create(['name' => 'Dian Catering']);
        $owner = User::factory()->vendor()->create(['email' => 'dian@example.com']);

        $this->actingAs(User::factory()->admin()->create())
            ->patch(route('vendors.owner.update', $vendor), ['email' => '  Dian@Example.com '])
            ->assertRedirect();

        expect($vendor->refresh()->user_id)->toBe($owner->id);

        $this->actingAs($owner)
            ->get(route('vendors.index'))
            ->assertInertia(fn(Assert $page) => $page->has('vendors', 1)->where('vendors.0.name', 'Dian Catering')->where('vendors.0.status', 'approved'));
    });

    test('only a vendor account can own a vendor', function () {
        $vendor = RecommendedVendor::factory()->create();
        User::factory()->create(['email' => 'member@example.com']);

        $this->actingAs(User::factory()->admin()->create())
            ->patch(route('vendors.owner.update', $vendor), ['email' => 'member@example.com'])
            ->assertSessionHasErrors('email');

        $this->actingAs(User::factory()->admin()->create())
            ->patch(route('vendors.owner.update', $vendor), ['email' => 'nobody@example.com'])
            ->assertSessionHasErrors('email');

        expect($vendor->refresh()->user_id)->toBeNull();
    });

    test('an empty email gives the vendor back to the admin', function () {
        $vendor = RecommendedVendor::factory()->create(['user_id' => User::factory()->vendor()]);

        $this->actingAs(User::factory()->admin()->create())
            ->patch(route('vendors.owner.update', $vendor), ['email' => ''])
            ->assertRedirect();

        expect($vendor->refresh()->user_id)->toBeNull();
    });

    test('only the admin can hand a vendor over', function () {
        $vendor = RecommendedVendor::factory()->create();
        $owner = User::factory()->vendor()->create();

        $this->actingAs($owner)->patch(route('vendors.owner.update', $vendor), ['email' => $owner->email])->assertForbidden();
        $this->actingAs(User::factory()->create())->patch(route('vendors.owner.update', $vendor), ['email' => $owner->email])->assertForbidden();

        expect($vendor->refresh()->user_id)->toBeNull();
    });
});
