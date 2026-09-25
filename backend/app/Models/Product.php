<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'name','slug','short_description','description','logo','cover_image',
        'website_url','cta_text','status','featured','sort_order',
        'seo_title','seo_description'
    ];

    protected $casts = ['featured' => 'boolean'];

    public function features(): HasMany
    {
        return $this->hasMany(ProductFeature::class)->orderBy('sort_order');
    }
}
