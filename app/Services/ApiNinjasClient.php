<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class ApiNinjasClient
{
    private string $base = 'https://api.api-ninjas.com/v1';
    private string $key;

    public function __construct()
    {
        $this->key = (string) env('API_NINJAS_KEY', '');
    }

    private function client()
    {
        return Http::withHeaders(['X-Api-Key' => $this->key])->baseUrl($this->base)->timeout(20);
    }

    public function city(string $name): array
    {
        return $this->client()->get('/city', ['name' => $name])->throw()->json();
    }

    public function airportsByCountry(string $country): array
    {
        return $this->client()->get('/airports', ['country' => $country])->throw()->json();
    }
}
