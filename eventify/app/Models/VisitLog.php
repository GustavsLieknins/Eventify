<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VisitLog extends Model
{
    protected $fillable = [
        'user_id', 'path', 'referrer', 'country', 'ip', 'user_agent', 'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];
}
