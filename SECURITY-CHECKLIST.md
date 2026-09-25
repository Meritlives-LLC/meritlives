# MERITLIVES Security Checklist

## Before launch

- [ ] APP_DEBUG=false
- [ ] Production APP_KEY configured
- [ ] HTTPS enabled
- [ ] Production credentials stored outside Git
- [ ] Database user is not root
- [ ] CORS restricted to real frontend origin
- [ ] Filament access restricted
- [ ] Roles and permissions verified
- [ ] Contact endpoint rate limited
- [ ] Newsletter endpoint rate limited
- [ ] Security headers verified
- [ ] File upload MIME/size rules reviewed
- [ ] Uploaded files stored safely
- [ ] Logs do not contain passwords/tokens
- [ ] Backups configured
- [ ] Backup restoration tested
- [ ] Error monitoring configured
- [ ] Sitemap verified
- [ ] robots.txt verified
- [ ] Search endpoint reviewed for abuse
- [ ] API validation tests passing
- [ ] Production smoke test completed
