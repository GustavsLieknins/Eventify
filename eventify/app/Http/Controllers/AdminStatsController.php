<?php

namespace App\Http\Controllers;

use App\Models\BookmarkedTrip;
use App\Models\SearchLog;
use App\Models\ShareLink;
use App\Models\ShareLinkVisit;
use App\Models\VisitLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminStatsController extends Controller
{
    public function dashboard(Request $request)
    {
        $totals = [
            'visits' => (int) VisitLog::query()->count(),
            'searches' => (int) SearchLog::query()->count(),
            'share_links' => (int) ShareLink::query()->count(),
            'share_opens' => (int) $this->sumOpens(),
            'trips' => (int) BookmarkedTrip::query()->count(),
        ];

        $days = 14;

        $visitsByDay = VisitLog::query()
            ->selectRaw('DATE(created_at) as d, COUNT(*) as c')
            ->where('created_at', '>=', now()->subDays($days))
            ->groupBy('d')
            ->orderBy('d')
            ->get()
            ->map(fn ($r) => ['d' => $r->d, 'c' => (int) $r->c]);

        $searchesByDay = SearchLog::query()
            ->selectRaw('DATE(created_at) as d, COUNT(*) as c')
            ->where('created_at', '>=', now()->subDays($days))
            ->groupBy('d')
            ->orderBy('d')
            ->get()
            ->map(fn ($r) => ['d' => $r->d, 'c' => (int) $r->c]);

        $topCountries = VisitLog::query()
            ->select('country', DB::raw('COUNT(*) as c'))
            ->whereNotNull('country')
            ->groupBy('country')
            ->orderByDesc('c')
            ->limit(10)
            ->get()
            ->map(fn ($r) => ['country' => $r->country, 'c' => (int) $r->c]);

        $topPaths = VisitLog::query()
            ->select('path', DB::raw('COUNT(*) as c'))
            ->groupBy('path')
            ->orderByDesc('c')
            ->limit(10)
            ->get()
            ->map(fn ($r) => ['path' => $r->path, 'c' => (int) $r->c]);

        $topQueries = SearchLog::query()
            ->select('query', DB::raw('COUNT(*) as c'))
            ->groupBy('query')
            ->orderByDesc('c')
            ->limit(10)
            ->get()
            ->map(fn ($r) => ['query' => $r->query, 'c' => (int) $r->c]);

        $topSavedTitles = BookmarkedTrip::query()
            ->select('title', DB::raw('COUNT(*) as c'))
            ->whereNotNull('title')
            ->where('title', '<>', '')
            ->groupBy('title')
            ->orderByDesc('c')
            ->limit(10)
            ->get()
            ->map(fn ($r) => ['title' => $r->title, 'c' => (int) $r->c]);

        $topShared = ShareLink::query()
            ->with(['trip:id,title'])
            ->orderByDesc('opens')
            ->limit(10)
            ->get()
            ->map(fn ($l) => [
                'id' => $l->id,
                'slug' => $l->slug,
                'opens' => (int) $l->opens,
                'title' => optional($l->trip)->title,
            ]);

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

    private function sumOpens(): int
    {
        return \Schema::hasColumn('share_links', 'opens')
            ? (int) ShareLink::query()->sum('opens')
            : (int) ShareLinkVisit::query()->count();
    }
}
