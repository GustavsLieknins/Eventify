<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\SearchLog;
use App\Services\HasDataClient;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class EventController extends Controller
{
    public function search(Request $request, HasDataClient $hasData)
    {
        $q = trim((string) $request->input('q', ''));
        if ($q === '') {
            return response()->json(['error' => 'q is required'], 422);
        }

        $params = [
            'q' => $q,
            'location' => $request->input('location', 'United Kingdom'),
            'gl' => $this->normalizeGl($request->input('gl', 'uk')),
            'hl' => strtolower($request->input('hl', 'en')),
            'start' => (int) $request->input('start', 0),
        ];
        if ($request->filled('when')) {
            $params['htichips'] = $request->input('when');
        }

        $normalized = $this->normalizeParams($params);

        // simple search log (kept)
        SearchLog::query()->create([
            'user_id' => optional($request->user())->id,
            'query' => $q,
            'ip' => $request->ip(),
        ]);

        try {
            $live = $hasData->events($normalized);

            // make sure response shape is predictable
            if (empty($live)) {
                $live = ['eventsResults' => [], 'results' => [], 'items' => []];
            }

            $live['_meta'] = [
                'from_cache' => false,
                'refreshing' => false,
                'status' => 'live',
                'fetched_at' => now()->toIso8601String(),
            ];

            return response()->json($live);
        } catch (\Throwable $e) {
            return response()->json([
                'eventsResults' => [],
                'results' => [],
                'items' => [],
                '_meta' => [
                    'from_cache' => false,
                    'refreshing' => false,
                    'status' => 'error',
                    'error' => config('app.debug') ? $e->getMessage() : 'Search failed',
                ],
            ], 500);
        }
    }

    private function normalizeParams(array $params): array
    {
        $p = $params;
        $p['gl'] = $this->normalizeGl(Arr::get($p, 'gl', 'uk'));
        $p['hl'] = strtolower(Arr::get($p, 'hl', 'en'));
        $p['q'] = trim((string) Arr::get($p, 'q', ''));
        ksort($p);

        return $p;
    }

    private function normalizeGl(string $gl): string
    {
        $gl = strtolower($gl);

        return in_array($gl, ['uk', 'gb'], true) ? 'gb' : $gl;
    }
}
