<?php

use App\Http\Controllers\VendorController;
use App\Http\Controllers\VendorReviewController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('vendors', [VendorController::class, 'index'])->name('vendors.index');

    Route::middleware('can:manage-vendors')->group(function () {
        Route::post('vendors', [VendorController::class, 'store'])->name('vendors.store');
        Route::patch('vendors/{vendor}', [VendorController::class, 'update'])->name('vendors.update');
        Route::delete('vendors/{vendor}', [VendorController::class, 'destroy'])->name('vendors.destroy');
    });

    Route::put('vendors/{vendor}/review', [VendorReviewController::class, 'store'])->name('vendors.review.store');
    Route::delete('vendors/{vendor}/review', [VendorReviewController::class, 'destroy'])->name('vendors.review.destroy');

    // Vendors users entered themselves have no record of their own, only a name.
    Route::put('vendor-reviews', [VendorReviewController::class, 'storeByName'])->name('vendor-reviews.store');
    Route::delete('vendor-reviews', [VendorReviewController::class, 'destroyByName'])->name('vendor-reviews.destroy');
});
