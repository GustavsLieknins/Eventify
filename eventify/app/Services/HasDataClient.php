<?php
// app/Services/HasDataClient.php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class HasDataClient
{
    private string $baseUrl;
    private string $apiKey;

    public function __construct()
    {
        $this->baseUrl = config('services.hasdata.base_url', 'https://api.hasdata.com');
        $this->apiKey  = (string) config('services.hasdata.api_key', env('HASDATA_API_KEY', ''));
    }

    private function client()
    {
        return Http::withHeaders([
            'Content-Type' => 'application/json',
            'x-api-key'    => $this->apiKey, // HasData requires this header
        ])->baseUrl($this->baseUrl);
    }

    public function events(array $params)
    {
        return $this->client()
            ->get('/scrape/google/events', $params)
            ->throw()
            ->json();
    }

    public function flights(array $params)
    {
        return $this->client()
            ->get('/scrape/google/flights', $params)
            ->throw()
            ->json();
    }

    public function mapsSearch(array $params)
    {
        // Correct path per HasData docs for Google Maps Search
        return $this->client()
            ->get('/scrape/google-maps/search', $params)
            ->throw()
            ->json();
    }
}
