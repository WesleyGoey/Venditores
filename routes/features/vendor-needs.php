<?php


use App\Http\Controllers\QuoteController;
use App\Http\Controllers\VendorNeedController;
use App\Http\Controllers\VendorNeedMatchController;
use App\Http\Controllers\VendorSearchController;
use Illuminate\Support\Facades\Route;


Route::middleware(['auth', 'verified'])->scopeBindings()->group(function () {
    Route::resource('events.vendor-needs', VendorNeedController::class)
        ->only(['show', 'store', 'update', 'destroy']);


    Route::post('events/{event}/vendor-needs/{vendor_need}/match', [VendorNeedMatchController::class, 'store'])
        ->middleware('throttle:ai-matching')
        ->name('events.vendor-needs.match.store');


    Route::post('events/{event}/vendor-needs/{vendor_need}/search', [VendorSearchController::class, 'store'])
        ->middleware('throttle:ai-vendor-search')
        ->name('events.vendor-needs.search.store');


    Route::resource('events.vendor-needs.quotes', QuoteController::class)
        ->only(['store', 'update', 'destroy']);
});
