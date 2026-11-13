<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

foreach (glob(__DIR__.'/features/*.php') as $featureRoutes) {
    require $featureRoutes;
}

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
