<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'type', 'status'];

    public function news(): HasMany { return $this->hasMany(News::class); }
    public function blogPosts(): HasMany { return $this->hasMany(BlogPost::class); }
}
