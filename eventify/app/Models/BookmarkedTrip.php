<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookmarkedTrip extends Model
{
    protected $fillable = ['user_id', 'title', 'flights', 'hotels'];

    protected $casts = [
        'flights' => 'array',
        'hotels'  => 'array',
    ];
}
