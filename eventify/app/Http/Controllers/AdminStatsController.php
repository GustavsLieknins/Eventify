<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminStatsController extends Controller
{
    public function dashboard(Request $request)
    {
        $totals = [
            'visits' => DB::table('visit_logs')->count(),
            'searches' => DB::table('search_logs')->count(),
            'share_links' => DB::table('share_links')->count(),

            'share_opens' => $this->sumOrZero('share_links', 'opens') ?: DB::table('share_link_visits')->count(),
            'trips' => DB::table('bookmarked_trips')->count(),
        ];

        $days = 14;
        $visitsByDay = DB::table('visit_logs')
            ->selectRaw('DATE(created_at) as d, COUNT(*) as c')
            ->where('created_at', '>=', now()->subDays($days))
            ->groupBy('d')
            ->orderBy('d')
            ->get();

        $searchesByDay = DB::table('search_logs')
            ->selectRaw('DATE(created_at) as d, COUNT(*) as c')
            ->where('created_at', '>=', now()->subDays($days))
            ->groupBy('d')
            ->orderBy('d')
            ->get();

        $topCountries = DB::table('visit_logs')
            ->select('country', DB::raw('COUNT(*) as c'))
            ->whereNotNull('country')
            ->groupBy('country')
            ->orderByDesc('c')
            ->limit(10)
            ->get();

        $topPaths = DB::table('visit_logs')
            ->select('path', DB::raw('COUNT(*) as c'))
            ->groupBy('path')
            ->orderByDesc('c')
            ->limit(10)
            ->get();

        $topQueries = DB::table('search_logs')
            ->select('query', DB::raw('COUNT(*) as c'))
            ->groupBy('query')
            ->orderByDesc('c')
            ->limit(10)
            ->get();

        $topSavedTitles = DB::table('bookmarked_trips')
            ->select('title', DB::raw('COUNT(*) as c'))
            ->whereNotNull('title')
            ->where('title', '<>', '')
            ->groupBy('title')
            ->orderByDesc('c')
            ->limit(10)
            ->get();

        $topShared = DB::table('share_links')
            ->join('bookmarked_trips', 'bookmarked_trips.id', '=', 'share_links.trip_id')
            ->select('share_links.id', 'share_links.slug', 'share_links.opens', 'bookmarked_trips.title')
            ->orderByDesc('share_links.opens')
            ->limit(10)
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'totals' => $totals,
            'visitsByDay' => $visitsByDay,
            'searchesByDay' => $searchesByDay,
            'topCountries' => $topCountries,
            'topPaths' => $topPaths,
            'topQueries' => $topQueries,
            'topSavedTitles' => $topSavedTitles,
            'topShared' => $topShared,
        ]);
    }

    private function sumOrZero(string $table, string $column): int
    {
        $exists = DB::getSchemaBuilder()->hasColumn($table, $column);

        return $exists ? (int) DB::table($table)->sum($column) : 0;
    }
}
