<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BookmarkedTrip;

class TripController extends Controller
{
    public function store(Request $request)
    {
        if (!auth()->check()) {
            return response()->json([
                'message'  => 'You must be logged in to save a trip.',
                'redirect' => route('login'),
            ], 401);
        }

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

        return response()->json([
            'message' => 'Trip saved successfully',
            'trip'    => $trip,
        ]);
    }
    public function index()
    {
        $trips = BookmarkedTrip::where('user_id', auth()->id())->latest()->get();
        return response()->json($trips);
    }

    public function show($id)
    {
        $trip = BookmarkedTrip::where('user_id', auth()->id())->findOrFail($id);
        return response()->json($trip);
    }
}
