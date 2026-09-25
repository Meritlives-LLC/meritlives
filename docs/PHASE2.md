# MERITLIVES LLC — Phase 2

## Database foundation

Run:

```bash
php artisan migrate
php artisan db:seed
```

Core relationships:

- Category has many News
- Category has many BlogPosts
- BlogPost belongs to User
- BlogPost belongs to Category
- BlogPost belongs to many Tags
- News belongs to Category
- Product has many ProductFeatures

## Important

The seeded product is intentionally a placeholder development record. Replace it with actual MERITLIVES products through the CMS in later phases.
