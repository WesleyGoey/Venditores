<?php

namespace App\Http\Controllers;

use App\Enums\EventStatus;
use App\Models\Event;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class EventCompletionController extends Controller
{
    /**
     * Mark the event as completed.
     */
    public function store(Event $event): RedirectResponse
    {
        Gate::authorize('update', $event);

        $event->update(['status' => EventStatus::Completed]);

        return back()->with('success', 'Event marked as completed.');
    }

    /**
     * Reopen a completed event.
     */
    public function destroy(Event $event): RedirectResponse
    {
        Gate::authorize('update', $event);

        $event->update([
            'status' => $event->analyzed_at !== null ? EventStatus::Analyzed : EventStatus::Draft,
        ]);

        return back()->with('success', 'Event reopened.');
    }
}
