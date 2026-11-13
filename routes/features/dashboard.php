<?php


use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HistoryController;
use Illuminate\Support\Facades\Route;


Route::middleware(['auth', 'verified', 'not-admin'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('history', HistoryController::class)->name('history');
});
