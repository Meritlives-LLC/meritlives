# MERITLIVES LLC — Phase 5: Next.js Frontend/API Integration

This phase connects the frontend to the Laravel API built in Phase 3.

## Added

- Typed API models
- Central API client
- Server-side API query functions
- Products listing/detail
- Services listing/detail
- News listing/detail
- Blog listing/detail
- Contact form
- Newsletter form
- API loading/error primitives
- Page metadata
- Environment variables

## Setup

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Set:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Install and run:

```bash
npm install
npm run dev
```

## Important

The project is intentionally additive. Existing MERITLIVES branding/layout components should be retained and these data-fetching components should be integrated into the actual design rather than replacing the design system.

Before production:

- configure HTTPS URLs
- configure Laravel CORS for the frontend domain
- use production database and mail settings
- validate uploaded image URLs
- sanitize/render rich HTML according to the application's content policy
- configure image domains in `next.config.js`
- add authentication for any future private API endpoints
