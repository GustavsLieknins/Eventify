<?php

use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\TravelController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('/events', [EventController::class, 'search']);
    Route::get('/travel/flights', [TravelController::class, 'flights']);
    Route::get('/travel/hotels', [TravelController::class, 'hotels']);
});



