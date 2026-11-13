<?php


use App\Http\Controllers\EventAnalysisController;
use App\Http\Controllers\EventCompletionController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\EventProposalController;
use Illuminate\Support\Facades\Route;


Route::middleware(['auth', 'verified', 'not-admin'])->group(function () {
    Route::post('events/extract', [EventController::class, 'extract'])
        ->middleware('throttle:ai-analysis')
        ->name('events.extract');

    Route::resource('events', EventController::class);


    Route::get('events/{event}/proposal', [EventProposalController::class, 'show'])->name('events.proposal');


    Route::post('events/{event}/analysis', [EventAnalysisController::class, 'store'])
        ->middleware('throttle:ai-analysis')
        ->name('events.analysis.store');


    Route::post('events/{event}/completion', [EventCompletionController::class, 'store'])->name('events.completion.store');
    Route::delete('events/{event}/completion', [EventCompletionController::class, 'destroy'])->name('events.completion.destroy');
});
