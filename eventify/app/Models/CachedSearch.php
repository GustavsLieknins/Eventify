<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;

class CachedSearch extends Model
{
    protected $fillable = [
        'key_hash',
        'params_json',
        'payload_json',
        'etag',
        'status',
        'fetched_at',
        'refresh_after',
        'expires_at',
        'error_text',
    ];

    protected $casts = [
        'params_json'   => 'array',
        'fetched_at'    => 'datetime',
        'refresh_after' => 'datetime',
        'expires_at'    => 'datetime',
        'created_at'    => 'datetime',
        'updated_at'    => 'datetime',
    ];

    public function isFresh(): bool
    {
        $now = CarbonImmutable::now();
        return $this->status === 'fresh'
            && $this->fetched_at
            && $this->expires_at
            && $now->lessThan($this->expires_at);
    }

    public function isSoftStale(): bool
    {
        $now = CarbonImmutable::now();
        return $this->refresh_after && $now->greaterThanOrEqualTo($this->refresh_after);
    }

    public function markFresh(int $softMinutes = 10, int $hardMinutes = 1440): void
    {
        $now = CarbonImmutable::now();
        $this->status        = 'fresh';
        $this->fetched_at    = $now;
        $this->refresh_after = $now->addMinutes($softMinutes);
        $this->expires_at    = $now->addMinutes($hardMinutes);
        $this->error_text    = null;
    }
}
