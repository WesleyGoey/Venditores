<?php

namespace App\Http\Controllers;

use App\Enums\ProcurementStatus;
use App\Models\Event;
use App\Models\VendorNeed;
use App\Services\Gemini\VendorFinder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class VendorSearchController extends Controller
{
    /**
     * Search the web for vendors that could fulfil the need.
     */
    public function store(Request $request, Event $event, VendorNeed $vendorNeed, VendorFinder $finder): JsonResponse
    {
        Gate::authorize('update', $event);

        $validated = $request->validate([
            'keywords' => ['nullable', 'string', 'max:200'],
        ]);

        $result = $finder->find($vendorNeed, $validated['keywords'] ?? null);

        if ($vendorNeed->procurement_status === ProcurementStatus::Drafting) {
            $vendorNeed->update(['procurement_status' => ProcurementStatus::Searching]);
        }

        return response()->json($result);
    }
}
