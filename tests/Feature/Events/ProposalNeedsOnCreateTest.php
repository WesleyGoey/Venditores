<?php


use App\Enums\EventStatus;
use App\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;


beforeEach(function () {
    Storage::fake('local');
    config(['services.gemini.key' => 'test-key']);
});


function readingAnswer(array $overrides = []): array
{
    return [
        'name' => 'NPLC',
        'event_date' => '2027-03-01',
        'location' => 'Surabaya',
        'total_budget' => 50_000_000,
        'description' => null,
        'summary' => 'A national programming competition.',
        'scale' => 'medium',
        'estimated_attendees' => 250,
        'vendor_needs' => [
            ['category' => 'Venue', 'specification' => 'Hall for 250', 'allocation_percentage' => 60, 'is_vital' => true],
            ['category' => 'Catering', 'specification' => '250 lunch boxes', 'allocation_percentage' => 40, 'is_vital' => false],
        ],
        ...$overrides,
    ];
}


/**
 * What the form sends back when the committee presses Create event after reading a proposal.
 */
function createWithNeeds(array $overrides = []): array
{
    return [
        'name' => 'NPLC',
        'event_date' => '2027-03-01',
        'total_budget' => 100_000_001,
        'summary' => 'A national programming competition.',
        'scale' => 'medium',
        'estimated_attendees' => 250,
        'vendor_needs' => [
            ['category' => 'Venue', 'specification' => 'Hall for 250', 'allocation_percentage' => 60, 'is_vital' => 1],
            ['category' => 'Catering', 'specification' => '250 lunch boxes', 'allocation_percentage' => 40, 'is_vital' => 0],
        ],
        ...$overrides,
    ];
}


describe('reading a proposal in the form', function () {
    test('the details and the vendor needs come back from one Gemini call, and nothing is saved', function () {
        Http::fake([geminiEndpoint() => Http::response(geminiResponse(readingAnswer()))]);
        $user = User::factory()->create();


        $this->actingAs($user)
            ->postJson(route('events.extract'), ['proposal' => UploadedFile::fake()->create('proposal.pdf', 200, 'application/pdf')])
            ->assertOk()
            ->assertJsonPath('name', 'NPLC')
            ->assertJsonPath('total_budget', 50_000_000)
            ->assertJsonPath('analysis.scale', 'medium')
            ->assertJsonPath('analysis.estimated_attendees', 250)
            ->assertJsonCount(2, 'analysis.vendor_needs')
            ->assertJsonPath('analysis.vendor_needs.0.category', 'Venue')
            ->assertJsonPath('analysis.vendor_needs.0.allocation_percentage', 60)
            ->assertJsonPath('analysis.vendor_needs.0.is_vital', true);


        Http::assertSentCount(1);
        Http::assertSent(fn (Request $request) => isset($request['generationConfig']['responseJsonSchema']['properties']['vendor_needs'])
            && isset($request['generationConfig']['responseJsonSchema']['properties']['event_date']));
        expect($user->events()->count())->toBe(0);
    });


    test('the details still fill the form when Gemini returns no usable vendor needs', function () {
        Http::fake([geminiEndpoint() => Http::response(geminiResponse(readingAnswer(['vendor_needs' => []])))]);


        $this->actingAs(User::factory()->create())
            ->postJson(route('events.extract'), ['proposal' => UploadedFile::fake()->create('proposal.pdf', 200, 'application/pdf')])
            ->assertOk()
            ->assertJsonPath('name', 'NPLC')
            ->assertJsonPath('analysis', null);
    });
});


describe('creating the event', function () {
    test('the vendor needs are created with the event, split from the budget that was finally entered', function () {
        Http::preventStrayRequests();
        $user = User::factory()->create();


        $this->actingAs($user)->post(route('events.store'), createWithNeeds())->assertSessionHasNoErrors();


        $event = $user->events()->sole();
        expect($event)
            ->status->toBe(EventStatus::Analyzed)
            ->summary->toBe('A national programming competition.')
            ->scale->toBe('medium')
            ->estimated_attendees->toBe(250)
            ->analyzed_at->not->toBeNull();


        $needs = $event->vendorNeeds()->orderBy('id')->get();
        expect($needs->pluck('category')->all())->toBe(['Venue', 'Catering'])
            ->and($needs->pluck('allocated_budget')->all())->toBe([60_000_001, 40_000_000])
            ->and($needs->sum('allocated_budget'))->toBe(100_000_001)
            ->and($needs->pluck('is_vital')->all())->toBe([true, false]);
    });


    test('an event created without vendor needs stays a draft', function () {
        $user = User::factory()->create();


        $this->actingAs($user)->post(route('events.store'), createWithNeeds(['vendor_needs' => [], 'summary' => null, 'scale' => null, 'estimated_attendees' => null]));


        expect($user->events()->sole())->status->toBe(EventStatus::Draft)
            ->and($user->events()->sole()->vendorNeeds()->count())->toBe(0);
    });


    test('the proposal file is still stored with the vendor needs', function () {
        $user = User::factory()->create();


        $this->actingAs($user)->post(route('events.store'), [
            ...createWithNeeds(),
            'proposal' => UploadedFile::fake()->create('proposal.pdf', 200, 'application/pdf'),
        ]);


        expect($user->events()->sole()->proposal_path)->not->toBeNull();
    });


    test('invalid vendor needs stop the event from being created', function (array $needs) {
        $user = User::factory()->create();


        $this->actingAs($user)
            ->post(route('events.store'), createWithNeeds(['vendor_needs' => $needs]))
            ->assertSessionHasErrors();


        expect($user->events()->count())->toBe(0);
    })->with([
        'a need without a category' => [[['category' => '', 'allocation_percentage' => 50]]],
        'a percentage over 100' => [[['category' => 'Venue', 'allocation_percentage' => 150]]],
        'a percentage that is not a number' => [[['category' => 'Venue', 'allocation_percentage' => 'lots']]],
        'too many needs' => [array_fill(0, 31, ['category' => 'Venue', 'allocation_percentage' => 1])],
    ]);


    test('an unknown scale is rejected', function () {
        $this->actingAs(User::factory()->create())
            ->post(route('events.store'), createWithNeeds(['scale' => 'gigantic']))
            ->assertSessionHasErrors('scale');
    });
});
