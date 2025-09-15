<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookmarkedTrip extends Model
{
    use HasFactory;

    protected $fillable = ['title', 'flights', 'hotels', 'user_id'];

    protected $casts = [
        'flights' => 'array',
        'hotels' => 'array',
    ];
    public function user()
    {
        return $this->belongsTo(User::class);
    }

}
