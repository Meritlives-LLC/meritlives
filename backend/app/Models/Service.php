<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = [
        'name','slug','short_description','description','icon',
        'featured','sort_order','status','seo_title','seo_description'
    ];

    protected $casts = ['featured' => 'boolean'];
}
