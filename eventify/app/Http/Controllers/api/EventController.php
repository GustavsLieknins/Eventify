<?php
// app/Http/Controllers/Api/EventController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\HasDataClient;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function search(Request $request, HasDataClient $hasData)
    {
        try {
            $q = trim((string) $request->input('q'));
            if ($q === '') {
                return response()->json(['error' => 'q is required'], 422);
            }

            $params = [
                'q'        => $q,
                'location' => $request->input('location', 'United Kingdom'),
                'gl'       => $request->input('gl', 'uk'),
                'hl'       => $request->input('hl', 'en'),
                'start'    => (int) $request->input('start', 0), // 0,10,20...
            ];

            if ($request->filled('when')) {
                $params['htichips'] = $request->input('when'); // e.g., date:month
            }

            $data = $hasData->events($params);
            return response()->json($data);
        } catch (\Illuminate\Http\Client\RequestException $e) {
            return response()->json([
                'error'  => 'HasData request failed',
                'status' => $e->response?->status(),
                'body'   => $e->response?->json() ?? $e->response?->body(),
            ], 502);
        } catch (\Throwable $e) {
            return response()->json([
                'error'   => 'Server error',
                'message' => config('app.debug') ? $e->getMessage() : 'Unexpected error',
            ], 500);
        }
    }
}
