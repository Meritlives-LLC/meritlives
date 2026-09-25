# MERITLIVES LLC — Phase 8 Launch Checklist

## A. Code and dependencies
- [ ] Frontend `npm ci` succeeds.
- [ ] Frontend `npm run build` succeeds.
- [ ] Backend `composer install --no-dev --optimize-autoloader` succeeds.
- [ ] Backend `php artisan test` passes.
- [ ] No unresolved TypeScript/build errors.
- [ ] No debug statements or test credentials committed.

## B. Environment
- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] Real production `APP_KEY` configured.
- [ ] Production API URL configured.
- [ ] Production frontend URL configured.
- [ ] Database credentials configured securely.
- [ ] Mail credentials configured.
- [ ] Queue/cache configuration verified.

## C. Database and storage
- [ ] Production database created.
- [ ] Migrations applied with `--force`.
- [ ] Storage link created.
- [ ] Media uploads tested.
- [ ] Backup completed before launch.
- [ ] Restore procedure tested.

## D. CMS
- [ ] Filament admin login works.
- [ ] Super administrator verified.
- [ ] Editor permissions verified.
- [ ] Author permissions verified.
- [ ] Product publishing tested.
- [ ] Service publishing tested.
- [ ] News publishing tested.
- [ ] Blog publishing tested.
- [ ] Media upload tested.

## E. Frontend
- [ ] Homepage loads.
- [ ] About page loads.
- [ ] Products list/detail loads.
- [ ] Services list/detail loads.
- [ ] News list/detail loads.
- [ ] Blog list/detail loads.
- [ ] Search works.
- [ ] Contact form works.
- [ ] Newsletter form works.
- [ ] Mobile navigation/layout checked.
- [ ] 404 behavior checked.

## F. API
- [ ] `/api/v1/health` returns OK.
- [ ] CORS works only for approved frontend origins.
- [ ] Validation errors are handled.
- [ ] Rate limiting works.
- [ ] API 4xx/5xx responses are user-safe.
- [ ] No sensitive information appears in API errors.

## G. SEO
- [ ] Page titles are meaningful.
- [ ] Meta descriptions are present where required.
- [ ] `/sitemap.xml` works.
- [ ] `/robots.txt` works.
- [ ] Canonical URLs reviewed.
- [ ] Social sharing metadata reviewed.
- [ ] Images have appropriate alt text.

## H. Security
- [ ] HTTPS works.
- [ ] Security headers verified.
- [ ] Admin route protected.
- [ ] Database root account is not used by the application.
- [ ] Production secrets are outside Git.
- [ ] File upload validation reviewed.
- [ ] Dependency audit reviewed.
- [ ] Login/rate-limit behavior tested.

## I. Monitoring
- [ ] Application logs available.
- [ ] Server error monitoring configured.
- [ ] Queue failures monitored.
- [ ] Database availability monitored.
- [ ] Disk usage monitored.
- [ ] SSL expiry monitored.

## J. Go-live
- [ ] Final backup taken.
- [ ] DNS verified.
- [ ] SSL verified.
- [ ] Frontend deployed.
- [ ] Backend deployed.
- [ ] Smoke tests completed.
- [ ] Stakeholder acceptance completed.
- [ ] Rollback package retained.
