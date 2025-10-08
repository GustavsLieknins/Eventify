<?php

namespace App\Http\Controllers;

use App\Models\VisitLog;
use Illuminate\Http\Request;

class AdminGeoApiController extends Controller
{
    public function points(Request $request)
    {
        $days = (int) $request->query('days', 30);
        $rows = VisitLog::query()
            ->selectRaw('ROUND(lat, 1) as lat, ROUND(lng, 1) as lng, COUNT(*) as c')
            ->whereNotNull('lat')->whereNotNull('lng')
            ->where('created_at', '>=', now()->subDays($days))
            ->groupBy('lat', 'lng')
            ->orderByDesc('c')
            ->limit(5000)
            ->get()
            ->map(fn ($r) => ['lat' => (float) $r->lat, 'lng' => (float) $r->lng, 'count' => (int) $r->c]);

        return response()->json(['points' => $rows]);
    }

    public function latest(Request $request)
    {
        $limit = (int) $request->query('limit', 500);
        $rows = VisitLog::query()
            ->whereNotNull('lat')->whereNotNull('lng')
            ->orderByDesc('id')
            ->limit($limit)
            ->get(['lat', 'lng', 'country', 'city', 'region', 'created_at'])
            ->map(fn ($r) => [
                'lat' => (float) $r->lat,
                'lng' => (float) $r->lng,
                'country' => $r->country,
                'city' => $r->city,
                'region' => $r->region,
                'ts' => $r->created_at?->toIso8601String(),
            ]);

        return response()->json(['visits' => $rows]);
    }
}
