<?php

namespace App\Http\Controllers;

use App\Enums\VendorStatus;
use App\Http\Requests\OwnVendorRequest;
use App\Models\RecommendedVendor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * The vendors a vendor account lists. Every save goes back to the admin, so users never see an unchecked change.
 */
class OwnVendorController extends Controller
{
    public function store(OwnVendorRequest $request): RedirectResponse
    {
        $vendor = new RecommendedVendor($request->validated());
        $vendor->forceFill(['user_id' => $request->user()->id, 'status' => VendorStatus::Pending])->save();


        return back()->with('success', 'Sent to the admin. Users see it once it is approved.');
    }

    public function update(OwnVendorRequest $request, RecommendedVendor $vendor): RedirectResponse
    {
        $this->ownedBy($request, $vendor);

        $vendor->fill($request->validated())->forceFill(['status' => VendorStatus::Pending, 'admin_note' => null])->save();

        return back()->with('success', 'Saved and sent to the admin. Users see it again once it is approved.');
    }

    public function destroy(Request $request, RecommendedVendor $vendor): RedirectResponse
    {
        $this->ownedBy($request, $vendor);

        $vendor->delete();

        return back()->with('success', 'Vendor deleted.');
    }

    /**
     * Someone else's vendor does not exist as far as this account is concerned.
     */
    private function ownedBy(Request $request, RecommendedVendor $vendor): void
    {
        abort_unless($vendor->user_id === $request->user()->id, 404);
    }
}
