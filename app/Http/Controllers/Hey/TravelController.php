<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Services\ApiNinjasClient;
use App\Services\HasDataClient;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class TravelController extends Controller
{
    public function flights(Request $request, HasDataClient $hasData, ApiNinjasClient $ninja)
    {
        $from = strtoupper((string) $request->input('from', env('DEFAULT_DEPARTURE_IATA', 'RIX')));
        $stay = (int) $request->input('stayNights', 1);

        $outboundDate = $request->input('outboundDate');
        $returnDate = $request->input('returnDate');
        $eventDate = $request->input('date');

        $arrivalId = $this->resolveArrivalId($request);
        if (!$arrivalId) {
            $label = trim((string) ($request->input('city') ?: $request->input('destination') ?: ''));
            if ($label === '' && $request->filled('countryCode')) {
                $label = $request->input('countryCode');
            }
            $arrivalId = $this->resolveViaApi($label, $hasData, $ninja);
        }

        if (!$arrivalId) {
            return response()->json(['error' => 'No destination could be resolved'], 422);
        }

        $today = Carbon::today();

        if (!$outboundDate) {
            if ($eventDate) {
                $d = Carbon::parse($eventDate);
                $outboundDate = $d->greaterThan($today)
                    ? $d->copy()->subDay()->format('Y-m-d')
                    : $today->copy()->addDays(7)->format('Y-m-d');
            } else {
                $outboundDate = $today->copy()->addDays(14)->format('Y-m-d');
            }
        }

        if (!$returnDate) {
            $returnDate = Carbon::parse($outboundDate)->addDays(max(1, $stay))->format('Y-m-d');
        }

        if (Carbon::parse($outboundDate)->lessThanOrEqualTo($today)) {
            $outboundDate = $today->copy()->addDays(3)->format('Y-m-d');
            $returnDate = Carbon::parse($outboundDate)->addDays(max(1, $stay))->format('Y-m-d');
        }

        $destCountryCode = strtoupper((string) $request->input('countryCode', ''));
        $hl = env('GOOGLE_HL', 'en');
        $gl = $this->glForCountry($destCountryCode) ?? $this->normalizeGl(env('GOOGLE_GL', 'gb'));

        $params = [
            'departureId' => $from,
            'arrivalId' => $arrivalId,
            'outboundDate' => $outboundDate,
            'returnDate' => $returnDate,
            'currency' => env('DEFAULT_CURRENCY', 'EUR'),
            'hl' => $hl,
            'gl' => $gl,
        ];

        $data = $hasData->flights($params);

        return response()->json($data);
    }

    public function hotels(Request $request, HasDataClient $hasData)
    {
        $q = trim((string) $request->input('q', ''));
        $city = trim((string) $request->input('city', ''));
        $venue = trim((string) $request->input('venue', ''));

        if ($q !== '') {
            $primary = $hasData->mapsSearch(['q' => $q, 'hl' => 'en']);
            $list = $this->pluckPlaces($primary);
            if (!empty($list)) {
                return response()->json($list);
            }
        }

        if ($city !== '') {
            $fallbackCity = $hasData->mapsSearch(['q' => "hotels in {$city}", 'hl' => 'en']);
            $list = $this->pluckPlaces($fallbackCity);
            if (!empty($list)) {
                return response()->json($list);
            }

            $geo = $hasData->mapsSearch(['q' => $city, 'hl' => 'en']);
            $coords = $this->extractFirstCoordinates($geo);
            if ($coords) {
                $ll = sprintf('@%F,%F,14z', $coords['lat'], $coords['lng']);
                $anchored = $hasData->mapsSearch(['q' => 'hotels', 'hl' => 'en', 'll' => $ll, 'start' => 0]);
                $list = $this->pluckPlaces($anchored);
                if (!empty($list)) {
                    return response()->json($list);
                }
            }
        }

        if ($venue !== '') {
            $geoVenue = $hasData->mapsSearch(['q' => $city ? "{$venue} {$city}" : $venue, 'hl' => 'en']);
            $coordsV = $this->extractFirstCoordinates($geoVenue);
            if ($coordsV) {
                $ll = sprintf('@%F,%F,15z', $coordsV['lat'], $coordsV['lng']);
                $anchoredV = $hasData->mapsSearch(['q' => 'hotels', 'hl' => 'en', 'll' => $ll, 'start' => 0]);
                $list = $this->pluckPlaces($anchoredV);
                if (!empty($list)) {
                    return response()->json($list);
                }
            }
        }

        return response()->json([]);
    }

    private function resolveArrivalId(Request $request): ?string
    {
        foreach (['arrivalId', 'arrivalAirportCode', 'arrivalCityCode'] as $key) {
            $val = strtoupper(trim((string) $request->input($key, '')));
            if ($val !== '') {
                return $val;
            }
        }

        $city = strtolower(trim((string) $request->input('city', '')));
        $country = strtolower(trim((string) $request->input('country', '')));
        $countryCode = strtoupper(trim((string) $request->input('countryCode', '')));

        if ($city === '') {
            $alt = strtoupper(trim((string) $request->input('to', '')));

            return $alt !== '' ? $alt : null;
        }

        $map = [
            'london' => ['GB' => 'LON', 'UK' => 'LON', 'CA' => 'YXU'],
            'paris' => ['FR' => 'PAR'],
            'new york' => ['US' => 'NYC'],
            'milan' => ['IT' => 'MIL'],
            'rome' => ['IT' => 'ROM'],
            'tokyo' => ['JP' => 'TYO'],
            'washington' => ['US' => 'WAS'],
            'chicago' => ['US' => 'CHI'],
        ];

        if ($countryCode !== '' && isset($map[$city][$countryCode])) {
            return $map[$city][$countryCode];
        }
        if ($city === 'london') {
            if (in_array($country, ['united kingdom', 'england', 'great britain', 'uk'], true)) {
                return 'LON';
            }
            if ($country === 'canada') {
                return 'YXU';
            }
        }
        if (isset($map[$city]) && count($map[$city]) === 1) {
            return current($map[$city]);
        }

        return null;
    }

    private function resolveViaApi(string $label, HasDataClient $hasData, ApiNinjasClient $ninja): ?string
    {
        $label = trim($label);
        if ($label === '') {
            return null;
        }

        $city = $label;
        $cc = '';
        if (strpos($label, ',') !== false) {
            $parts = array_map('trim', explode(',', $label));
            $city = $parts[0] ?? $label;
            $tail = strtoupper($parts[count($parts) - 1] ?? '');
            if (preg_match('/^[A-Z]{2}$/', $tail)) {
                $cc = $tail;
            }
        }

        $byCity = [];
        try {
            $byCity = $ninja->airportsByCity($city, $cc ?: null);
        } catch (\Throwable $e) {
        }
        foreach ((array) $byCity as $ap) {
            $iata = $ap['iata'] ?? '';
            if ($iata) {
                return $iata;
            }
        }

        $lat = null;
        $lng = null;
        try {
            $geo = $ninja->geocode($city, $cc ?: null);
            if (is_array($geo) && !empty($geo)) {
                $lat = $geo[0]['latitude'] ?? null;
                $lng = $geo[0]['longitude'] ?? null;
            }
        } catch (\Throwable $e) {
        }

        if ($lat === null || $lng === null) {
            try {
                $gs = $hasData->mapsSearch(['q' => $label, 'hl' => 'en']);
                $list = $gs['results'] ?? $gs['places'] ?? $gs['localResults'] ?? [];
                if (!empty($list)) {
                    $g = $list[0]['gpsCoordinates'] ?? null;
                    if ($g) {
                        $lat = $g['latitude'] ?? null;
                        $lng = $g['longitude'] ?? null;
                    }
                }
            } catch (\Throwable $e) {
            }
        }

        $pool = [];
        if ($cc) {
            try {
                $pool = $ninja->airportsByCountry($cc);
            } catch (\Throwable $e) {
            }
        }
        if (!is_array($pool) || empty($pool)) {
            try {
                $pool = $ninja->airportsByCity($city);
            } catch (\Throwable $e) {
            }
        }

        $best = null;
        $bestD = PHP_FLOAT_MAX;
        foreach ((array) $pool as $ap) {
            $iata = $ap['iata'] ?? '';
            if (!$iata) {
                continue;
            }
            $alat = isset($ap['latitude']) ? (float) $ap['latitude'] : null;
            $alng = isset($ap['longitude']) ? (float) $ap['longitude'] : null;
            $dist = 0;
            if ($lat !== null && $lng !== null && $alat !== null && $alng !== null) {
                $dist = $this->haversine($lat, $lng, $alat, $alng);
            }
            if ($dist < $bestD) {
                $bestD = $dist;
                $best = $iata;
            }
        }

        return $best ?: null;
    }

    private function haversine($lat1, $lon1, $lat2, $lon2)
    {
        $toRad = function ($d) { return ($d * M_PI) / 180; };
        $R = 6371;
        $dLat = $toRad($lat2 - $lat1);
        $dLon = $toRad($lon2 - $lon1);
        $a = sin($dLat / 2) ** 2 + cos($toRad($lat1)) * cos($toRad($lat2)) * sin($dLon / 2) ** 2;

        return $R * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    private function normalizeGl(string $gl): string
    {
        $gl = strtolower($gl);
        if (in_array($gl, ['uk', 'gb'], true)) {
            return 'gb';
        }

        return $gl;
    }

    private function glForCountry(string $countryCode): ?string
    {
        $cc = strtoupper($countryCode);
        if ($cc === '') {
            return null;
        }
        $map = ['GB' => 'gb', 'UK' => 'gb', 'CA' => 'ca', 'US' => 'us', 'FR' => 'fr', 'IT' => 'it', 'JP' => 'jp', 'DE' => 'de', 'ES' => 'es'];

        return $map[$cc] ?? null;
    }

    private function pluckPlaces(array $response): array
    {
        foreach (['localResults', 'results', 'places', 'data'] as $k) {
            if (!empty($response[$k]) && is_array($response[$k])) {
                return $response[$k];
            }
        }
        if (function_exists('array_is_list') && array_is_list($response)) {
            return $response;
        }
        if (array_values($response) === $response) {
            return $response;
        }

        return [];
    }

    private function extractFirstCoordinates(array $response): ?array
    {
        $list = $this->pluckPlaces($response);
        if (empty($list)) {
            return null;
        }
        foreach ($list as $item) {
            $lat = $item['gpsCoordinates']['latitude'] ?? null;
            $lng = $item['gpsCoordinates']['longitude'] ?? null;
            if (is_numeric($lat) && is_numeric($lng)) {
                return ['lat' => (float) $lat, 'lng' => (float) $lng];
            }
        }

        return null;
    }
}
