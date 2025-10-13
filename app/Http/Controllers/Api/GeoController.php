<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ApiNinjasClient;
use Illuminate\Http\Request;

class GeoController extends Controller
{
    public function airports(Request $request, ApiNinjasClient $ninja)
    {
        $label = trim((string) $request->input('cityLabel', ''));
        if ($label === '') {
            return response()->json(['codes' => []]);
        }

        [$city, $iso2FromLabel] = $this->splitLabel($label);

        $lat = null;
        $lon = null;
        $countryName = '';

        try {
            $geo = $ninja->city($city);
            if (is_array($geo) && !empty($geo)) {
                $first = $geo[0];
                $lat = isset($first['latitude']) ? (float) $first['latitude'] : null;
                $lon = isset($first['longitude']) ? (float) $first['longitude'] : null;
                $countryName = trim((string) ($first['country'] ?? ''));
            }
        } catch (\Throwable $e) {
        }

        if ($countryName === '' && $iso2FromLabel !== '') {
            $countryName = $this->iso2ToName($iso2FromLabel);
        }

        if ($lat === null || $lon === null || $countryName === '') {
            return response()->json(['codes' => []]);
        }

        $pool = [];
        try {
            $pool = $ninja->airportsByCountry($countryName);
        } catch (\Throwable $e) {
        }

        if (!is_array($pool) || empty($pool)) {
            return response()->json(['codes' => []]);
        }

        $candidates = [];
        foreach ($pool as $ap) {
            $iata = trim((string) ($ap['iata'] ?? ''));
            if ($iata === '') {
                continue;
            }
            $aLat = isset($ap['latitude']) ? (float) $ap['latitude'] : null;
            $aLon = isset($ap['longitude']) ? (float) $ap['longitude'] : null;
            if ($aLat === null || $aLon === null) {
                continue;
            }
            $dist = $this->haversine($lat, $lon, $aLat, $aLon);
            $candidates[] = ['code' => $iata, 'dist' => $dist];
        }

        usort($candidates, fn ($a, $b) => $a['dist'] <=> $b['dist']);
        $codes = array_values(array_unique(array_map(fn ($r) => $r['code'], $candidates)));

        return response()->json(['codes' => array_slice($codes, 0, 8)]);
    }

    private function splitLabel(string $label): array
    {
        $parts = array_values(array_filter(array_map('trim', explode(',', $label))));
        $city = $parts[0] ?? $label;
        $iso2 = '';
        foreach (array_reverse($parts) as $p) {
            if (preg_match('/^[A-Z]{2}$/', $p)) {
                $iso2 = $p;
                break;
            }
        }

        return [$city, $iso2];
    }

    private function iso2ToName(string $cc): string
    {
        $map = [
            'GB' => 'United Kingdom', 'UK' => 'United Kingdom', 'IE' => 'Ireland', 'FR' => 'France', 'IT' => 'Italy', 'ES' => 'Spain', 'PT' => 'Portugal', 'DE' => 'Germany', 'NL' => 'Netherlands', 'BE' => 'Belgium', 'CH' => 'Switzerland', 'AT' => 'Austria', 'PL' => 'Poland', 'CZ' => 'Czechia', 'SK' => 'Slovakia', 'HU' => 'Hungary', 'SI' => 'Slovenia', 'HR' => 'Croatia', 'BA' => 'Bosnia and Herzegovina', 'RS' => 'Serbia', 'ME' => 'Montenegro', 'MK' => 'North Macedonia', 'AL' => 'Albania', 'GR' => 'Greece', 'RO' => 'Romania', 'BG' => 'Bulgaria', 'SE' => 'Sweden', 'NO' => 'Norway', 'FI' => 'Finland', 'EE' => 'Estonia', 'LV' => 'Latvia', 'LT' => 'Lithuania', 'DK' => 'Denmark', 'IS' => 'Iceland', 'US' => 'United States', 'CA' => 'Canada', 'MX' => 'Mexico', 'BR' => 'Brazil', 'AR' => 'Argentina', 'CL' => 'Chile', 'PE' => 'Peru', 'CO' => 'Colombia', 'UY' => 'Uruguay', 'AU' => 'Australia', 'NZ' => 'New Zealand', 'JP' => 'Japan', 'KR' => 'South Korea', 'CN' => 'China', 'HK' => 'Hong Kong', 'SG' => 'Singapore', 'TH' => 'Thailand', 'VN' => 'Vietnam', 'MY' => 'Malaysia', 'ID' => 'Indonesia', 'PH' => 'Philippines', 'AE' => 'United Arab Emirates', 'QA' => 'Qatar', 'SA' => 'Saudi Arabia', 'IN' => 'India', 'PK' => 'Pakistan', 'IL' => 'Israel', 'TR' => 'Türkiye', 'EG' => 'Egypt', 'MA' => 'Morocco', 'ZA' => 'South Africa',
        ];

        return $map[$cc] ?? '';
    }

    private function haversine($lat1, $lon1, $lat2, $lon2)
    {
        $toRad = fn ($d) => ($d * M_PI) / 180;
        $R = 6371;
        $dLat = $toRad($lat2 - $lat1);
        $dLon = $toRad($lon2 - $lon1);
        $a = sin($dLat / 2) ** 2 + cos($toRad($lat1)) * cos($toRad($lat2)) * sin($dLon / 2) ** 2;

        return $R * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
