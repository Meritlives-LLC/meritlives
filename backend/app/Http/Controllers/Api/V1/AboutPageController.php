<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\AboutPageContent;

class AboutPageController extends Controller
{
    public function __invoke(AboutPageContent $content)
    {
        return response()->json(['data' => $content->publicContent()])->header('Cache-Control', 'private, no-store, max-age=0');
    }
}
