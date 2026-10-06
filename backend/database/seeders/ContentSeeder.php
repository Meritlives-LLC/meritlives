<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductFeature;
use App\Models\Service;
use App\Models\Setting;
use App\Models\Tag;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ContentSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Technology', 'type' => 'news'],
            ['name' => 'Business', 'type' => 'news'],
            ['name' => 'Digital Innovation', 'type' => 'news'],
            ['name' => 'Digital Transformation', 'type' => 'blog'],
            ['name' => 'Technology Business', 'type' => 'blog'],
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(
                ['slug' => Str::slug($category['name'])],
                [
                    'name' => $category['name'],
                    'type' => $category['type'],
                    'status' => 'active',
                ]
            );
        }

        foreach ([
            'Artificial Intelligence',
            'Cybersecurity',
            'Software',
            'Digital Transformation',
        ] as $tag) {
            Tag::updateOrCreate(
                ['slug' => Str::slug($tag)],
                ['name' => $tag]
            );
        }

        $services = [
            ['name' => 'Software Development', 'slug' => 'software-development'],
            ['name' => 'Web Development', 'slug' => 'web-development'],
            ['name' => 'AI Solutions', 'slug' => 'ai-solutions'],
            ['name' => 'Digital Transformation', 'slug' => 'digital-transformation'],
            ['name' => 'IT Solutions', 'slug' => 'it-solutions'],
            ['name' => 'Cybersecurity', 'slug' => 'cybersecurity'],
        ];

        foreach ($services as $index => $service) {
            Service::updateOrCreate(
                ['slug' => $service['slug']],
                [
                    'name' => $service['name'],
                    'short_description' => 'Practical technology solutions designed around organisational needs.',
                    'status' => 'published',
                    'featured' => $index < 6,
                    'sort_order' => $index + 1,
                ]
            );
        }

        $products = [
            [
                'name' => 'MERITLIVES Digital Platform',
                'slug' => 'meritlives-digital-platform',
                'short_description' => 'A foundation for delivering connected digital experiences.',
            ],
        ];

        foreach ($products as $product) {
            $created = Product::updateOrCreate(
                ['slug' => $product['slug']],
                [
                    'name' => $product['name'],
                    'short_description' => $product['short_description'],
                    'status' => 'draft',
                    'featured' => true,
                    'sort_order' => 1,
                ]
            );

            ProductFeature::updateOrCreate(
                ['product_id' => $created->id, 'name' => 'Flexible digital architecture'],
                ['description' => 'Designed to support future product capabilities.', 'sort_order' => 1]
            );
        }

        $settings = [
            'company_name' => 'MERITLIVES LLC',
            'company_description' => 'Technology, software and digital innovation solutions built for practical impact.',
            'default_seo_title' => 'MERITLIVES LLC — Technology for Practical Impact',
            'default_seo_description' => 'MERITLIVES LLC delivers technology, software and digital innovation solutions.',
        ];

        foreach ($settings as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value, 'type' => 'string']
            );
        }
    }
}
