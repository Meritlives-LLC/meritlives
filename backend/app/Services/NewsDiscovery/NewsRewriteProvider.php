<?php

namespace App\Services\NewsDiscovery;

interface NewsRewriteProvider
{
    /** @return array{headline:string,lead:string,paragraphs:array<int,string>,slug:string,seo_title:string,meta_description:string,verification_flags:array<int,string>,provider?:string,model?:string} */
    public function rewrite(array $source): array;
}
