<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VisitLog extends Model
{
    protected $table = 'visit_logs';

    protected $fillable = [
        'user_id', 'path', 'referrer', 'country', 'ip', 'user_agent', 'meta', 'lat', 'lng', 'city', 'region',
    ];

    protected $casts = [
        'meta' => 'array',
        'lat' => 'float',
        'lng' => 'float',
    ];

    public $timestamps = true;
}
