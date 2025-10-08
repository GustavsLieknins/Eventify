<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VisitLog;
use Illuminate\Http\Request;

class TelemetryController extends Controller
{
    public function visit(Request $request)
    {
        $country = $this->countryFromRequest($request);

        VisitLog::create([
            'user_id' => optional($request->user())->id,
            'path' => (string) $request->input('path', $request->path()),
            'referrer' => (string) $request->input('referrer', $request->headers->get('Referer')),
            'country' => $country,
            'ip' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 1024),
            'meta' => $request->input('meta', null),
            'lat' => $request->input('lat'),
            'lng' => $request->input('lng'),
            'city' => $request->input('city'),
            'region' => $request->input('region'),
        ]);

        return response()->json(['ok' => true]);
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
        if ($p && strlen($p) === 2) {
            return strtoupper($p);
        }

        return null;
    }
}
