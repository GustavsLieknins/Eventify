<?php

use App\Http\Controllers\api\EventController;
use App\Http\Controllers\api\GeoController;
use App\Http\Controllers\Api\TelemetryController;
use App\Http\Controllers\api\TravelController;
use App\Http\Controllers\TripController;
use Illuminate\Support\Facades\Route;

Route::get('/events', [EventController::class, 'search']);
Route::get('/travel/flights', [TravelController::class, 'flights']);
Route::get('/travel/hotels', [TravelController::class, 'hotels']);
Route::get('/geo/airports', [GeoController::class, 'airports']);
Route::get('/api/geo/airports', [GeoController::class, 'airports']);

Route::post('/telemetry/visit', [TelemetryController::class, 'visit']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/trips', [TripController::class, 'index']);
    Route::get('/trips/{id}', [TripController::class, 'show']);
    Route::post('/trips', [TripController::class, 'store']);
});
