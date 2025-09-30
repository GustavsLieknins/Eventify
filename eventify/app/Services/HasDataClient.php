<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class HasDataClient
{
    private string $baseUrl;
    private string $apiKey;
    // /** @var array<string,string> */
    private array $endpoints;

    public function __construct()
    {
        $this->baseUrl   = (string) config('services.hasdata.base_url');
        $this->apiKey    = (string) config('services.hasdata.api_key');
        $this->endpoints = (array) config('services.hasdata.endpoints');
    }

    private function client()
    {
        return Http::withHeaders([
            'Content-Type' => 'application/json',
            'x-api-key'    => $this->apiKey,
        ])->baseUrl($this->baseUrl);
    }

    public function events(array $params)
    {
        return $this->client()
            ->get($this->endpoints['events'], $params)
            ->throw()
            ->json();
    }

    public function flights(array $params)
    {
        return $this->client()
            ->get($this->endpoints['flights'], $params)
            ->throw()
            ->json();
    }

    public function mapsSearch(array $params)
    {
        return $this->client()
            ->get($this->endpoints['maps_search'], $params)
            ->throw()
            ->json();
    }
}
