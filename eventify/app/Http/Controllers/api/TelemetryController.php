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
        ]);

        return response()->json(['ok' => true]);
    }

    private function countryFromRequest(Request $request): ?string
    {
        $candidates = [
            'CF-IPCountry', 'X-Country-Code', 'X-Geo-Country', 'X-App-Country',
        ];
        foreach ($candidates as $h) {
            $v = $request->headers->get($h);
            if ($v && strlen($v) === 2) {
                return strtoupper($v);
            }
        }

        $p = (string) $request->input('country', '');

        return $p && strlen($p) === 2 ? strtoupper($p) : null;
    }
}
