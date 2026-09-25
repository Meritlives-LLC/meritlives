# MERITLIVES LLC — Production Smoke Tests

Run these after deployment.

## 1. API health

```bash
curl -i https://api.example.com/api/v1/health
```

Expected:

```json
{
  "status": "ok",
  "service": "meritlives-api"
}
```

## 2. Frontend

Open:

- `/`
- `/about`
- `/products`
- `/services`
- `/news`
- `/blog`
- `/contact`
- `/search`

## 3. CMS

Open:

```text
/admin
```

Verify login and content publishing.

## 4. Content flow

1. Create/edit a product in Filament.
2. Publish it.
3. Open the frontend product listing.
4. Open the product detail page.
5. Confirm the updated content appears.

Repeat for:

- Service
- News
- Blog

## 5. Forms

Submit a valid contact form.

Verify:

- successful response
- validation
- database record/email workflow as configured

Submit newsletter signup.

Verify duplicate and invalid email behavior.

## 6. Security

Verify response headers:

```text
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
```

## 7. Failure behavior

Temporarily make the API unavailable and confirm the frontend does not expose stack traces, secrets or internal errors.

## 8. Mobile

Test at minimum:

- 360px
- 390px
- 768px
- 1024px
- desktop width

Check navigation, cards, forms, typography and images.
