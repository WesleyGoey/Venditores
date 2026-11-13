<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EventProposalController extends Controller
{
    /**
     * Stream the event's proposal PDF to its owner.
     */
    public function show(Event $event): StreamedResponse
    {
        Gate::authorize('view', $event);

        abort_unless($event->hasProposal(), 404);

        return Storage::disk(config('filesystems.proposal_disk'))->response(
            $event->proposal_path,
            $event->proposal_original_name ?? 'proposal.pdf',
            ['Content-Type' => 'application/pdf'],
        );
    }
}
