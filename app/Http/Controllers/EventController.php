<?php

namespace App\Http\Controllers;

use App\Enums\EventStatus;
use App\Enums\ProcurementStatus;
use App\Exceptions\GeminiException;
use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\UpdateEventRequest;
use App\Models\Event;
use App\Services\Gemini\ProposalExtractor;
use App\Services\RiskMonitor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function __construct(private RiskMonitor $riskMonitor) {}

    /**
     * Display the user's events.
     */
    public function index(Request $request): Response
    {
        $events = $request->user()->events()
            ->withCount('vendorNeeds')
            ->withSum('vendorNeeds', 'allocated_budget')
            ->orderBy('event_date')
            ->get()
            ->map(fn (Event $event): array => [
                ...$event->only(['id', 'name', 'event_date', 'location', 'total_budget', 'status', 'vendor_needs_count']),
                'event_date' => $event->event_date->toDateString(),
                'allocated_budget' => (int) $event->vendor_needs_sum_allocated_budget,
                'risk_level' => $this->riskMonitor->levelForDaysRemaining(
                    $this->riskMonitor->daysRemaining($event->event_date, now()),
                ),
            ]);

        return Inertia::render('events/index', [
            'events' => $events,
        ]);
    }

    /**
     * Show the form for creating a new event.
     */
    public function create(): Response
    {
        return Inertia::render('events/create');
    }

    /**
     * Store a newly created event.
     */
    /**
     * Read the basic details from a proposal PDF so the form can fill itself in.
     * Nothing is saved here.
     */
    public function extract(Request $request, ProposalExtractor $extractor): JsonResponse
    {
        $request->validate([
            'proposal' => ['required', 'file', 'mimes:pdf', 'max:'.StoreEventRequest::MAX_PROPOSAL_KILOBYTES],
        ]);

        set_time_limit(180);

        return response()->json((object) $extractor->extract((string) file_get_contents($request->file('proposal')->getRealPath())));
    }

    public function store(StoreEventRequest $request, ProposalExtractor $extractor): RedirectResponse
    {
        $details = $request->safe()->except('proposal');

        if ($request->hasFile('proposal')) {
            $details = $this->fillFromProposal($details, $request->file('proposal'), $extractor);
        }

        $event = $request->user()->events()->create([
            ...$details,
            'status' => EventStatus::Draft,
        ]);

        if ($request->hasFile('proposal')) {
            $this->storeProposal($event, $request->file('proposal'));
        }

        return to_route('events.show', $event)->with('success', 'Event created.');
    }

    /**
     * Display the event with its vendor needs and risk assessment.
     */
    public function show(Event $event): Response
    {
        Gate::authorize('view', $event);

        $event->load(['vendorNeeds' => fn ($query) => $query
            ->withCount('quotes')
            ->withMax('quotes', 'match_score')
            ->orderByDesc('is_vital')
            ->orderByDesc('allocated_budget'),
        ]);

        return Inertia::render('events/show', [
            'event' => [
                ...$event->toArray(),
                'event_date' => $event->event_date->toDateString(),
                'has_proposal' => $event->hasProposal(),
            ],
            'risk' => $this->riskMonitor->assess($event),
            'procurementStatuses' => $this->options(ProcurementStatus::cases()),
        ]);
    }

    /**
     * Show the form for editing the event.
     */
    public function edit(Event $event): Response
    {
        Gate::authorize('update', $event);

        return Inertia::render('events/edit', [
            'event' => [
                ...$event->only(['id', 'name', 'location', 'total_budget', 'description', 'proposal_original_name']),
                'event_date' => $event->event_date->toDateString(),
            ],
        ]);
    }

    /**
     * Update the event.
     */
    public function update(UpdateEventRequest $request, Event $event): RedirectResponse
    {
        $event->update($request->safe()->except('proposal'));

        if ($request->hasFile('proposal')) {
            $this->storeProposal($event, $request->file('proposal'));
        }

        return to_route('events.show', $event)->with('success', 'Event updated.');
    }

    /**
     * Delete the event and its proposal file.
     */
    public function destroy(Event $event): RedirectResponse
    {
        Gate::authorize('delete', $event);

        if ($event->hasProposal()) {
            Storage::disk(config('filesystems.proposal_disk'))->delete($event->proposal_path);
        }

        $event->delete();

        return to_route('events.index')->with('success', 'Event deleted.');
    }

    /**
     * Fill the blank event details from the proposal. What the user typed always wins.
     *
     * @param  array<string, mixed>  $details
     * @return array<string, mixed>
     */
    private function fillFromProposal(array $details, UploadedFile $proposal, ProposalExtractor $extractor): array
    {
        $fields = ['name', 'event_date', 'location', 'total_budget', 'description'];
        $required = ['name', 'event_date', 'total_budget'];
        $blank = fn (string $field): bool => blank($details[$field] ?? null);

        // Nothing to look up when the committee already typed the required details.
        if (collect($required)->doesntContain($blank)) {
            return $details;
        }

        set_time_limit(180);

        try {
            $found = $extractor->extract((string) file_get_contents($proposal->getRealPath()));
        } catch (GeminiException) {
            throw ValidationException::withMessages([
                'proposal' => 'We could not read the proposal. Fill in the details yourself.',
            ]);
        }

        foreach ($fields as $field) {
            if ($blank($field)) {
                $details[$field] = $found[$field] ?? null;
            }
        }

        // Arrow functions capture $details by value, so look at the filled copy here.
        $missing = collect($required)->filter(fn (string $field): bool => blank($details[$field] ?? null));

        if ($missing->isNotEmpty()) {
            throw ValidationException::withMessages(
                $missing->mapWithKeys(fn (string $field): array => [$field => 'Not found in the proposal. Please fill it in.'])->all(),
            );
        }

        return $details;
    }

    private function storeProposal(Event $event, UploadedFile $file): void
    {
        $disk = Storage::disk(config('filesystems.proposal_disk'));
        $previousPath = $event->proposal_path;

        $event->update([
            'proposal_path' => $disk->putFile("proposals/{$event->user_id}", $file),
            'proposal_original_name' => $file->getClientOriginalName(),
        ]);

        if ($previousPath !== null) {
            $disk->delete($previousPath);
        }
    }

    /**
     * @param  list<ProcurementStatus>  $cases
     * @return list<array{value: string, label: string}>
     */
    private function options(array $cases): array
    {
        return array_map(fn (ProcurementStatus $case): array => ['value' => $case->value, 'label' => $case->label()], $cases);
    }
}
