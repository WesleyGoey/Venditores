<?php

namespace App\Http\Controllers;

use App\Models\RecommendedVendor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class VendorReviewController extends Controller
{
    /**
     * Create or replace the signed in user's review. One review per user per vendor.
     */
    public function store(Request $request, RecommendedVendor $vendor): RedirectResponse
    {
        $data = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $vendor->reviews()->updateOrCreate(['user_id' => $request->user()->id], $data);

        return back()->with('success', 'Review saved.');
    }

    public function destroy(Request $request, RecommendedVendor $vendor): RedirectResponse
    {
        $vendor->reviews()->where('user_id', $request->user()->id)->delete();

        return back()->with('success', 'Review deleted.');
    }
}
