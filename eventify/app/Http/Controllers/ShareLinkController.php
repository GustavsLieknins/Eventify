<?php

namespace App\Http\Controllers;

use App\Models\BookmarkedTrip;
use App\Models\ShareLink;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ShareLinkController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'trip_id' => ['required', 'integer', 'exists:bookmarked_trips,id'],
            'expires_in' => ['nullable', 'integer', 'min:0'],
        ]);

        $user = $request->user();

        $trip = BookmarkedTrip::query()
            ->where('id', $validated['trip_id'])
            ->where('user_id', $user->id)
            ->firstOrFail();

        $existing = ShareLink::query()
            ->where('trip_id', $trip->id)
            ->where('user_id', $user->id)
            ->where(function ($q) {
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

        do {
            $slug = Str::lower(Str::random(10));
        } while (ShareLink::where('slug', $slug)->exists());

        $expiresAt = null;
        if (!empty($validated['expires_in'])) {
            $expiresAt = now()->addMinutes((int) $validated['expires_in']);
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

    public function show(Request $request, string $slug)
    {
        $link = ShareLink::with(['trip'])
            ->where('slug', $slug)
            ->firstOrFail();

        if ($link->isExpired()) {
            abort(410, 'This link has expired.');
        }

        $country = $this->countryFromRequest($request);

        \DB::transaction(function () use ($link, $request, $country) {
            \App\Models\ShareLinkVisit::create([
                'share_link_id' => $link->id,
                'user_id' => optional($request->user())->id,
                'country' => $country,
                'ip' => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 1024),
            ]);

            $link->increment('opens');
        });

        $trip = $link->trip;

        return Inertia::render('Bookmarks/SharedTrip', [
            'slug' => $link->slug,
            'title' => $trip->title,
            'trip' => [
                'id' => $trip->id,
                'title' => $trip->title,
                'flights' => $trip->flights ?? [],
                'hotels' => $trip->hotels ?? [],
            ],
            'meta' => [
                'created_at' => $trip->created_at?->toIso8601String(),
                'opens' => $link->opens,
            ],
        ]);
    }

    private function countryFromRequest(Request $request): ?string
    {
        foreach (['CF-IPCountry', 'X-Country-Code', 'X-Geo-Country', 'X-App-Country'] as $h) {
            $v = $request->headers->get($h);
            if ($v && strlen($v) === 2) {
                return strtoupper($v);
            }
        }
        $p = (string) $request->input('country', '');

        return $p && strlen($p) === 2 ? strtoupper($p) : null;
    }
}
