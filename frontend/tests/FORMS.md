# Isolated form verification

These checks never require Laravel, database access, migrations, seeders or real enquiries.
Use Node 22.23+ (the pinned jsdom release needs Node ^22.22.2 or ^24.15.0).

## Component/API tests

From `frontend`: `npm run test:forms`.

The Node test runner transpiles TS/TSX in memory. React Testing Library/jsdom render the actual forms and all six service pages. Every fetch is mocked, and unexpected requests fail. Cases cover confirmed receipts, delayed responses, same-tick duplicate submissions, linked 422 field errors, preserved values, retries, 429, 5xx, network failure, timeouts and malformed responses. No emitted application JavaScript is written.

## Responsive browser tests (PowerShell)

Use separate terminals, all in `frontend`:

1. Run `npm run test:forms:fixtures`. This starts a loopback-only GET fixture API on port 3139. All writes return 405.
2. Build only a disposable verification artifact:

```powershell
$env:NEXT_DIST_DIR='.next.forms-check'
$env:NEXT_PUBLIC_API_URL='http://127.0.0.1:3139/api/v1'
$env:NEXT_TELEMETRY_DISABLED='1'
npm run build
npm run start -- --hostname 127.0.0.1 --port 3138
```

3. Run `npm run test:forms:browser`. It uses locally installed Google Chrome headlessly; no browser download is required. It opens only the fixed loopback test origins, intercepts all contact POSTs, rejects other POST destinations, and blocks third-party requests.

The browser checks contact/newsletter layouts at 320/390/768/1440px, and all six enquiry modals at 390/1440px. Newsletter has no public mount, so its layout preview is rendered from the actual component with the built site CSS; its interactive behavior is covered by the component suite. Screenshots are written to an OS temporary directory, whose path is printed after completion.

Stop both test servers when finished. Do not deploy `.next.forms-check`: it contains a disposable local API URL. Next may update tsconfig.json and next-env.d.ts during a build; preserve and restore their pre-check content without reverting unrelated changes.

## Scope and limits

Laravel validation, persistence and throttles are unchanged. Browser/API responses are mocked, so these checks do not establish mail delivery or real-database behavior. Failed/ambiguous requests preserve input and never automatically retry. Pending requests are guarded per mounted form; this does not provide server-side idempotency after an uncertain network outcome or across tabs. An explicit backend receipt is required before inputs reset and success is announced.
