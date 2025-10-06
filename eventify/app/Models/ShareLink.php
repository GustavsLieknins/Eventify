<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShareLink extends Model
{
    protected $fillable = ['slug', 'user_id', 'trip_id', 'expires_at', 'opens'];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function trip(): BelongsTo
    {
        return $this->belongsTo(BookmarkedTrip::class, 'trip_id');
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && now()->greaterThan($this->expires_at);
    }
}
