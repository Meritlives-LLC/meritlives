# MERITLIVES LLC — Phase 3

## Laravel REST API

Implemented public API groups:

- `/api/v1/products`
- `/api/v1/services`
- `/api/v1/news`
- `/api/v1/blog`
- `/api/v1/categories`
- `/api/v1/search`
- `/api/v1/contact`
- `/api/v1/newsletter`
- `/api/v1/health`

## Verification

After copying these files into the Laravel backend:

```bash
php artisan route:list --path=api
php artisan migrate
php artisan db:seed
php artisan serve
```

Health check:

```text
GET http://127.0.0.1:8000/api/v1/health
```

The API is designed for the Next.js frontend. Admin write operations are intentionally not exposed as public endpoints; they will be implemented behind authentication and authorization through Filament and protected backend routes in later phases.

## Search

Search currently uses MySQL-compatible LIKE queries as required for the initial implementation. It searches news, blog posts, products and services.

## Contact and newsletter

Both public write endpoints have validation and request throttling. Newsletter storage does not claim to send campaigns; a mailing provider can be connected later.
