<?php

use App\Http\Controllers\Api\TelemetryController;
use App\Http\Controllers\TripController;
use Illuminate\Support\Facades\Route;

Route::post('/telemetry/visit', [TelemetryController::class, 'visit']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/trips', [TripController::class, 'index']);
    Route::get('/trips/{id}', [TripController::class, 'show']);
    Route::post('/trips', [TripController::class, 'store']);
});
