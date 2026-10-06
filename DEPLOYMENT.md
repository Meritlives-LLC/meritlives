# MERITLIVES LLC — Phase 7 Production Hardening & Deployment

## 1. Backend production setup

```bash
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Set:

```env
APP_ENV=production
APP_DEBUG=false
```

Never commit `.env` or real credentials.

## 2. Frontend

```bash
npm ci
npm run build
npm run start
```

Configure:

```env
NEXT_PUBLIC_API_URL=https://api.meritlives.com/api/v1
NEXT_PUBLIC_SITE_URL=https://www.meritlives.com
```

These values are also recorded in `frontend/.env.production` for production builds. Keep `frontend/.env.local` for local development; Next.js uses the local file when it is present, so production builds must run in the production environment without that local-only file.

## 3. CORS

Set:

```env
APP_URL=https://api.meritlives.com
FRONTEND_URL=https://www.meritlives.com
FILESYSTEM_DISK=public
```

Do not use `*` for production origins.

The public filesystem disk builds its URL from `APP_URL`, so uploaded files resolve under `https://api.meritlives.com/storage/...`. On the production host, run `php artisan storage:link` and ensure the `public/storage` link and storage permissions are in place. Those are deployment steps; no hosting files are changed here.

## 4. HTTPS

Use HTTPS for both frontend and API. Configure TLS at the reverse proxy/load balancer. Enable HSTS only after HTTPS is confirmed stable.

## 5. Database

Use a dedicated production database account with only the permissions required by the application. Do not use root.

Back up the database regularly and test restoration.

## 6. Filament

Restrict `/admin` to authorized users. Keep the four application roles:

- super_admin
- admin
- editor
- author

Review permissions before launch.

## 7. Rate limiting

Contact and newsletter endpoints use named throttles. Tune limits to actual traffic and abuse patterns.

## 8. Monitoring

At minimum monitor:

- HTTP 5xx responses
- queue failures
- scheduled task failures
- database availability
- disk/storage usage
- application logs
- SSL certificate expiry

## 9. Deployment order

1. Provision database and environment.
2. Deploy Laravel.
3. Run migrations.
4. Create storage link.
5. Configure Filament administrator.
6. Verify `/api/v1/health`.
7. Deploy Next.js.
8. Configure frontend/API domains.
9. Verify CORS.
10. Test contact/newsletter.
11. Test CMS content publishing.
12. Run smoke tests.
13. Enable production traffic.

## 10. Rollback

Keep the previous frontend build and backend release available until the new release passes smoke tests. Database migrations must be backward-compatible whenever possible.
