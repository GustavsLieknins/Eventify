<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
// routes/web.php
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\TravelController;

use App\Http\Controllers\TripController;
Route::get('/trips', [TripController::class, 'index']);       // get all trips
Route::get('/trips/{id}', [TripController::class, 'show']);   // get one trip
Route::post('/trips', [TripController::class, 'store']);      // save new trip


Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return response()->json(['id' => $request->user()->id]);
});

///////////////


Route::get('/bookmarks', fn() => Inertia::render('Bookmarks'))->name('bookmarks');




//////////////



Route::get('/dashboard', fn () => Inertia::render('Dashboard'))->name('dashboard');

// JSON endpoints consumed by the React app
Route::get('/api/events', [EventController::class, 'search']);
Route::get('/api/travel/flights', [TravelController::class, 'flights']);
Route::get('/api/travel/hotels', [TravelController::class, 'hotels']);

Route::middleware(['auth'])->group(function () {
    // Route::get('/dashboard', fn () => Inertia::render('Dashboard'))->name('dashboard');

    // // JSON endpoints consumed by the React app
    // Route::get('/api/events', [EventController::class, 'search']);
    // Route::get('/api/travel/flights', [TravelController::class, 'flights']);
    // Route::get('/api/travel/hotels', [TravelController::class, 'hotels']);
});

// Route::middleware(['auth'])->group(function () {
//     Route::get('/dashboard', fn() => Inertia::render('Dashboard'))->name('dashboard');

//     // JSON endpoints used by the React page:
//     Route::get('/api/events', [EventController::class, 'search']);
//     Route::get('/api/travel/flights', [TravelController::class, 'flights']);
//     Route::get('/api/travel/hotels', [TravelController::class, 'hotels']);
// });


Route::get('/', function () {
    return redirect('/dashboard');
});

// Route::middleware(['auth'])->group(function () {
//     Route::get('/dashboard', function () {
//         return Inertia::render('Dashboard');
//     })->name('dashboard');
// });

require __DIR__.'/auth.php';

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Route::get('/dashboard', function () {
//     return Inertia::render('Dashboard');
// })->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
