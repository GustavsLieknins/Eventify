<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminGeoApiController extends Controller
{
    public function points(Request $request)
    {
        $days = (int) $request->query('days', 365); // generous default
        $since = now()->subDays(max(0, $days));
        $limit = (int) $request->query('limit', 5000);
        $round = (float) $request->query('round', 0.1); // degrees grid
        $all = (int) $request->query('all', 0) === 1; // bypass date filter for debugging

        // MySQL ROUND to 1 decimal by default (0.1 grid). Force floats in JSON.
        $q = DB::table('visit_logs')
            ->selectRaw('ROUND(lat, 1) as lat_r, ROUND(lng, 1) as lng_r, COUNT(*) as c')
            ->whereNotNull('lat')
            ->whereNotNull('lng');

        if (!$all) {
            $q->where('created_at', '>=', $since);
        }

        $rows = $q->groupBy('lat_r', 'lng_r')
            ->orderByDesc('c')
            ->limit($limit)
            ->get();

        $points = $rows->map(function ($r) {
            return [
                'lat' => $r->lat_r !== null ? (float) $r->lat_r : null,
                'lng' => $r->lng_r !== null ? (float) $r->lng_r : null,
                'count' => (int) $r->c,
            ];
        })->values();

        return response()->json([
            'points' => $points,
            '_meta' => [
                'total_points' => $points->count(),
                'since' => $all ? null : $since->toIso8601String(),
                'grid_deg' => 0.1,
            ],
        ]);
    }

    public function latest(Request $request)
    {
        $limit = (int) $request->query('limit', 100);

        $visits = DB::table('visit_logs')
            ->select('id', 'path', 'country', 'lat', 'lng', 'city', 'region', 'created_at')
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(function ($r) {
                return [
                    'id' => (int) $r->id,
                    'path' => (string) $r->path,
                    'country' => $r->country ? (string) $r->country : null,
                    'lat' => $r->lat !== null ? (float) $r->lat : null,
                    'lng' => $r->lng !== null ? (float) $r->lng : null,
                    'city' => $r->city ?: null,
                    'region' => $r->region ?: null,
                    'created_at' => optional($r->created_at)->toDateTimeString(),
                ];
            });

        return response()->json([
            'visits' => $visits,
            '_meta' => ['count' => $visits->count()],
        ]);
    }
}
