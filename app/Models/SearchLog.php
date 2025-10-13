<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SearchLog extends Model
{
    protected $table = 'search_logs';

    protected $fillable = ['user_id', 'query', 'ip'];

    public $timestamps = true;
}
