<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShareLinkVisit extends Model
{
    protected $table = 'share_link_visits';

    protected $fillable = ['share_link_id', 'user_id', 'country', 'ip', 'user_agent'];

    public $timestamps = true;
}
