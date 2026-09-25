<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Media extends Model
{
    protected $fillable = [
        'name','path','disk','mime_type','size','width','height','alt_text'
    ];
}
