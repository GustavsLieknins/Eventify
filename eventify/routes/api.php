<?php

use App\Http\Controllers\AdminGeoApiController;
use App\Http\Controllers\Api\TelemetryController;
use App\Http\Controllers\TripController;
use Illuminate\Support\Facades\Route;

Route::post('/telemetry/visit', [TelemetryController::class, 'visit']);
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/admin/geo/points', [AdminGeoApiController::class, 'points']);
    Route::get('/admin/geo/latest', [AdminGeoApiController::class, 'latest']);
});
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/trips', [TripController::class, 'index']);
    Route::get('/trips/{id}', [TripController::class, 'show']);
    Route::post('/trips', [TripController::class, 'store']);
});
