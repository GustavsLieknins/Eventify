<?php

namespace App\Http\Controllers;

use App\Models\ShareLink;
use App\Models\BookmarkedTrip; // adjust if your model lives elsewhere / named differently
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ShareLinkController extends Controller
{
    // POST /share-links  (create or fetch existing)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'trip_id'     => ['required', 'integer', 'exists:bookmarked_trips,id'],
            'expires_in'  => ['nullable', 'integer', 'min:0'], // minutes (optional)
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();

        $trip = BookmarkedTrip::query()
            ->where('id', $validated['trip_id'])
            ->where('user_id', $user->id)
            ->firstOrFail();

        // Reuse existing active link if you want (optional):
        $existing = ShareLink::query()
            ->where('trip_id', $trip->id)
            ->where('user_id', $user->id)
            ->where(function($q){
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->orderByDesc('id')
            ->first();

        if ($existing) {
            return response()->json([
                'url' => route('share.show', $existing->slug),
                'slug' => $existing->slug,
            ]);
        }

        // Make a short, collision-checked slug
        do {
            $slug = Str::lower(Str::random(10));
        } while (ShareLink::where('slug', $slug)->exists());

        $expiresAt = null;
        if (!empty($validated['expires_in'])) {
            $expiresAt = now()->addMinutes((int)$validated['expires_in']);
        }

        $link = ShareLink::create([
            'slug' => $slug,
            'user_id' => $user->id,
            'trip_id' => $trip->id,
            'expires_at' => $expiresAt,
        ]);

        return response()->json([
            'url' => route('share.show', $link->slug),
            'slug' => $link->slug,
        ]);
    }

    // GET /s/{slug}  (public)
    public function show(Request $request, string $slug)
    {
        $link = ShareLink::with(['trip'])
            ->where('slug', $slug)
            ->firstOrFail();

        if ($link->isExpired()) {
            abort(410, 'This link has expired.');
        }

        // Eager-load relationships/shape the payload the same way Bookmarks expects
        $trip = $link->trip;

        return Inertia::render('Bookmarks/SharedTrip', [
            'slug'   => $link->slug,
            'title'  => $trip->title,
            'trip'   => [
                'id'     => $trip->id,
                'title'  => $trip->title,
                'flights'=> $trip->flights ?? [],
                'hotels' => $trip->hotels ?? [],
            ],
            'meta'   => [
                'created_at' => $trip->created_at?->toIso8601String(),
            ],
        ]);
    }
}
