<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Services\Gemini\ProposalAnalyzer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class EventAnalysisController extends Controller
{
    /**
     * Analyze the event proposal with Gemini and rebuild its vendor needs.
     */
    public function store(Event $event, ProposalAnalyzer $analyzer): RedirectResponse
    {
        Gate::authorize('update', $event);

        if (! $event->hasProposal()) {
            return back()->with('error', 'Upload a proposal PDF before running the analysis.');
        }

        set_time_limit(180);

        $event = $analyzer->analyze($event);

        return to_route('events.show', $event)->with(
            'success',
            "Proposal analyzed: {$event->vendorNeeds()->count()} vendor needs were created.",
        );
    }
}
