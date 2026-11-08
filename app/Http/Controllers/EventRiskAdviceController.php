<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Services\Gemini\RiskAdvisor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class EventRiskAdviceController extends Controller
{
    /**
     * Ask Gemini for risk mitigation advice for the event.
     */
    public function store(Event $event, RiskAdvisor $advisor): RedirectResponse
    {
        Gate::authorize('update', $event);

        $advisor->advise($event);

        return back()->with('success', 'Risk advice updated.');
    }
}