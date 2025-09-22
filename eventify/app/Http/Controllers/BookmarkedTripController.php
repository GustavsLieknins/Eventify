<?php

namespace App\Http\Controllers;

use App\Models\BookmarkedTrip;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BookmarkedTripController extends Controller
{
    // Show all trips for current user
    public function index()
    {
        $authId = auth()->id();
        info('Logged-in ID: '.$authId);

        $trips = BookmarkedTrip::where('user_id', $authId)->get();

        info('Trips found: '.count($trips));

        return Inertia::render('Bookmarks/Bookmarks', [
            'trips' => $trips->map(function ($trip) {
                return [
                    'id'     => $trip->id,
                    'title'  => $trip->title,
                    'flights'=> $trip->flights ?? [],
                    'hotels' => $trip->hotels ?? [],
                ];
            }),
            'user' => auth()->user(),
        ]);
    }

    public function store(Request $request)
    {
        \Log::info('Request payload', $request->all());

        $data = $request->validate([
            'title'   => 'nullable|string|max:255',
            'flights' => 'nullable|array',
            'hotels'  => 'nullable|array',
        ]);

        $trip = BookmarkedTrip::create([
            'user_id' => auth()->id(),
            'title'   => $data['title'] ?? 'My Trip',
            'flights' => $data['flights'] ?? [],
            'hotels'  => $data['hotels'] ?? [],
        ]);

        return redirect()->route('bookmarks')
            ->with('success', 'Trip saved successfully!');
    }

    // Delete a trip
    public function destroy($id)
    {
        $userId = auth()->id();

        $trip = BookmarkedTrip::where('id', $id)
            ->where('user_id', $userId)
            ->firstOrFail();

        $trip->delete();

        return response()->json(['success' => true]);
    }
}
