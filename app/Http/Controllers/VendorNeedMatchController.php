<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\VendorNeed;
use App\Services\Gemini\QuoteMatcher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class VendorNeedMatchController extends Controller
{
    /**
     * Score the need's quotes against its specification and budget.
     */
    public function store(Event $event, VendorNeed $vendorNeed, QuoteMatcher $matcher): RedirectResponse
    {
        Gate::authorize('update', $event);

        if (! $vendorNeed->quotes()->exists()) {
            return back()->with('error', 'Add at least one quote before matching.');
        }

        $matcher->match($vendorNeed);

        return back()->with('success', 'Quotes scored.');
    }
}
