<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BookmarkedTrip;

class TripController extends Controller
{
    // Save a new trip
    public function store(Request $request)
    {
        $data = $request->validate([
            'title'   => 'nullable|string|max:255',
            'flights' => 'required|array',
            'hotels'  => 'required|array',
        ]);

        // Add the authenticated user's ID
        $data['user_id'] = auth()->id();

        // Save the trip
        $trip = BookmarkedTrip::create([
            'user_id' => $data['user_id'],
            'title'   => $data['title'],
            'flights' => json_encode($data['flights']),
            'hotels'  => json_encode($data['hotels']),
        ]);

        return response()->json([
            'message' => 'Trip saved successfully',
            'trip'    => $trip
        ], 201);
    }

    // Get all trips for the logged-in user
    public function index()
    {
        $trips = BookmarkedTrip::where('user_id', auth()->id())->latest()->get();
        return response()->json($trips);
    }

    // Get single trip
    public function show($id)
    {
        $trip = BookmarkedTrip::where('user_id', auth()->id())->findOrFail($id);
        return response()->json($trip);
    }
}
