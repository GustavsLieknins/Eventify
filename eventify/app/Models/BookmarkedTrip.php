<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookmarkedTrip extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'flights',
        'hotels',
    ];

    protected $casts = [
        'flights' => 'array',
        'hotels'  => 'array',
    ];

    // If you have a users table with id PK:
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
