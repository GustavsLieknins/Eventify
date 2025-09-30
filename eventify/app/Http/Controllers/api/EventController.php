<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\RefreshEventsSearch;
use App\Models\CachedSearch;
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
            'q'        => $q,
            'location' => $request->input('location', 'United Kingdom'),
            'gl'       => $this->normalizeGl($request->input('gl', 'uk')),
            'hl'       => strtolower($request->input('hl', 'en')),
            'start'    => (int) $request->input('start', 0),
        ];
        if ($request->filled('when')) {
            $params['htichips'] = $request->input('when');
        }

        $normalized = $this->normalizeParams($params);
        $keyHash    = hash('sha256', json_encode($normalized));

        $cache = CachedSearch::where('key_hash', $keyHash)->first();
        if ($cache) {
            $payload = $cache->payload_json ? json_decode($cache->payload_json, true) : [];

            $refreshing = false;
            if ($cache->isSoftStale() || !$cache->isFresh()) {
                $refreshing = true;
                RefreshEventsSearch::dispatch($normalized, $keyHash, 10, 1440);
            }

            return response()->json(
                $this->mergeMeta($payload, [
                    'from_cache' => true,
                    'refreshing' => $refreshing,
                    'status'     => $cache->status,
                    'fetched_at' => optional($cache->fetched_at)->toIso8601String(),
                ])
            );
        }

     
        try {
            $live = $hasData->events($normalized);

            $row = CachedSearch::firstOrNew(['key_hash' => $keyHash]);
            $row->params_json  = $normalized;
            $row->payload_json = json_encode($live);
            $row->status = 'fresh';
            $row->markFresh(10, 1440);
            $row->save();

            return response()->json(
                $this->mergeMeta($live, [
                    'from_cache' => false,
                    'refreshing' => false,
                    'status'     => 'fresh',
                    'fetched_at' => optional($row->fetched_at)->toIso8601String(),
                ])
            );
        } catch (\Throwable $e) {
            CachedSearch::create([
                'key_hash'    => $keyHash,
                'params_json' => $normalized,
                'status'      => 'pending',
            ]);
            RefreshEventsSearch::dispatch($normalized, $keyHash, 10, 1440);

            return response()->json([
                'eventsResults' => [],
                'results'       => [],
                'items'         => [],
                '_meta' => [
                    'from_cache' => false,
                    'refreshing' => true,
                    'status'     => 'pending',
                    'fetched_at' => null,
                    'error'      => config('app.debug') ? $e->getMessage() : null,
                ],
            ]);
        }
    }

    private function normalizeParams(array $params): array
    {
        $p = $params;
        $p['gl'] = $this->normalizeGl(Arr::get($p, 'gl', 'uk'));
        $p['hl'] = strtolower(Arr::get($p, 'hl', 'en'));
        $p['q']  = trim((string) Arr::get($p, 'q', ''));
        ksort($p);
        return $p;
    }

    private function normalizeGl(string $gl): string
    {
        $gl = strtolower($gl);
        return in_array($gl, ['uk','gb'], true) ? 'gb' : $gl;
    }

    private function mergeMeta(array $payload, array $meta): array
    {
        if (empty($payload)) {
            $payload = ['eventsResults' => [], 'results' => [], 'items' => []];
        }
        $payload['_meta'] = $meta;
        return $payload;
    }
}
