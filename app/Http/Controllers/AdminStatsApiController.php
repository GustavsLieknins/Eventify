<?php

namespace App\Http\Controllers;

use App\Models\BookmarkedTrip;
use App\Models\SearchLog;
use App\Models\ShareLink;
use App\Models\ShareLinkVisit;
use App\Models\VisitLog;

class AdminStatsApiController extends Controller
{
    public function index()
    {
        return response()->json([
            'visits' => (int) VisitLog::query()->count(),
            'searches' => (int) SearchLog::query()->count(),
            'share_links' => (int) ShareLink::query()->count(),
            'share_opens' => (int) (\Schema::hasColumn('share_links', 'opens')
                ? ShareLink::query()->sum('opens')
                : ShareLinkVisit::query()->count()),
            'trips' => (int) BookmarkedTrip::query()->count(),
            'db' => config('database.default'),
            'dbname' => \DB::connection()->getDatabaseName(),
        ]);
    }
}
