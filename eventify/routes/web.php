<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\TravelController;
use App\Http\Controllers\BookmarkedTripController;
use App\Http\Controllers\ShareLinkController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return redirect()->route('dashboard');
});
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {

    // Bookmarks (Inertia pages + POST)
    Route::get('/bookmarks', [BookmarkedTripController::class, 'index'])->name('bookmarks');
    Route::post('/bookmarks', [BookmarkedTripController::class, 'store'])->name('bookmarks.store');
    Route::delete('/bookmarks/{id}', [BookmarkedTripController::class, 'destroy'])->name('bookmarks.destroy');
});

// JSON endpoints consumed by the React app (no auth required for search)
Route::get('/api/events', [EventController::class, 'search']);
Route::get('/api/travel/flights', [TravelController::class, 'flights']);
Route::get('/api/travel/hotels', [TravelController::class, 'hotels']);


// Breeze profile routes
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});



// Public shared page (read-only)
Route::get('/s/{slug}', [ShareLinkController::class, 'show'])->name('share.show');

// Auth required to create a share link
Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('/share-links', [ShareLinkController::class, 'store'])->name('share.store');
});

use App\Http\Controllers\Auth\SocialAuthController;

Route::get('/auth/{provider}/redirect', [SocialAuthController::class, 'redirect'])
    ->whereIn('provider', ['google','github'])
    ->name('social.redirect');

Route::get('/auth/{provider}/callback', [SocialAuthController::class, 'callback'])
    ->whereIn('provider', ['google','github'])
    ->name('social.callback');


require __DIR__.'/auth.php';
