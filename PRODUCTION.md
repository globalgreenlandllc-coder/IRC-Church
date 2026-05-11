# Production Readiness

Status of `App.jsx` against requirements for going live with real customer accounts.

## What's working

- All 16 pages render without crashes (verified by clean build, no runtime errors in dev).
- Every button in the sidebar walk has a handler. No more dead clicks.
- All forms validate before submit (`canSubmit` / `canSave` guards on Connection, NewEvent, ScheduleReport, InviteAdmin, BudgetRequest, NewMinistry, NewCampus, PaymentEditor).
- Role-aware UI: sidebar filters by role, auto-redirect on disallowed pages, editable fields disabled for read-only viewers.
- Theme system (light/dark) with theme-aware accent tokens.
- `PageErrorBoundary` catches render crashes in any page and shows a recovery card without killing the chrome.
- CSV downloads work end-to-end via Blob + anchor click. PDF prints via styled new-window + `window.print()`.
- File-size hygiene: no `console.log`, no `debugger`, no `TODO` markers, no empty `onClick={() => {}}` handlers.

## Blockers before real accounts

### 1. Authentication is fake

`USERS` is a hardcoded array of 6 demo identities. The TopBar role-switcher just calls `setCurrentUser`. The Login page's SSO + email/password just navigate to `#/app` — no auth check.

**Fix:** integrate an auth provider:
- **Supabase Auth** (recommended for speed): email/password + magic link + Google/Microsoft OAuth out of the box.
- **Clerk**: best UX, hosted sign-up/sign-in.
- **Auth0**: enterprise-grade SSO.

On successful login, the server returns `{ user, tenant_id, role, campus_id, ministry_id }`. Replace `useState(USERS[0])` with the real session.

### 2. No data persistence

Every page's state lives in React. Refresh = data gone. Needs a database.

**Recommendation:** Supabase (Postgres + Auth + Storage + Realtime).

Tables needed (every one has `tenant_id` for multi-tenancy):

| Table | Holds |
|---|---|
| `tenants` | One row per church |
| `users` | Per-tenant users, role, campus_id, ministry_id |
| `campuses` | Bellevue, Everett, Tacoma, Brooklyn, ... |
| `ministries` | Per-campus ministries with budget + spent |
| `recurring_payments` | Day-of-month, category, amount, campus_id |
| `scheduled_events` | One-time events |
| `paid_events` | Events with tickets + break-even math |
| `annual_budgets` | Mandatory + extras per campus per year (12 months each) |
| `monthly_donations` | Per-campus per-month totals |
| `connections` | Integration connections with `scope` field |
| `donations` | Individual donation transactions (donor, amount, source, scope) |
| `receipts` | Vendor, amount, date, status, uploaded_by |
| `activity_log` | Audit trail entries |
| `report_schedules` | Scheduled report configs |
| `notifications` | User settings per role/user |
| `subscriptions` | Stripe subscription state per tenant |

### 3. No API layer

Every mutation in the UI currently calls a local `setState`. Each needs a backend call.

**Fix:** Wrap each `setXxx` into an async function that:
1. Calls the backend (Supabase client or fetch)
2. Awaits the response
3. Updates local state from the response
4. Handles errors with a toast/banner

Pattern:
```js
const addMinistry = async (data) => {
  const { data: row, error } = await supabase
    .from("ministries")
    .insert({ ...data, tenant_id, campus_id })
    .select().single();
  if (error) return showError(error.message);
  setMinistries((prev) => [...prev, row]);
  await logActivity({ type: "create", ministry: row.name, note: "..." });
};
```

### 4. Multi-tenancy not enforced

Currently hardcoded for IRC Church. Every tenant must see only its own data.

**Fix:** Postgres Row Level Security policies. Example for `ministries`:

```sql
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON ministries
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

Supabase wires this via the JWT. Server-side queries respect it automatically.

### 5. Environment + secrets

No `.env` setup. Production needs:

```bash
# .env.production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
VITE_SENTRY_DSN=...
```

Vite reads `VITE_*` prefixed vars. Never commit `.env*` (already in `.gitignore`).

### 6. Deployment

Static SPA → deploy to **Vercel**, **Netlify**, or **Cloudflare Pages**. Each gives:
- HTTPS cert auto
- Branch previews
- Static asset CDN
- Custom domain
- One-click rollback

Steps:
1. Push to GitHub (already done — main branch)
2. Connect repo to Vercel
3. Set environment variables in dashboard
4. Vercel auto-builds on push to `main`

### 7. Mobile responsive

Desktop-first design. On mobile (<768px):
- Sidebar should collapse to a hamburger drawer
- Tables need horizontal scroll or stacked layout
- Modals need `max-height: 90vh` + scroll
- KPI grids should stack vertically

**Fix:** Add CSS breakpoints + a `useMediaQuery` hook. Roughly 1–2 days of polish.

### 8. Accessibility

- Keyboard navigation untested (Tab order, Esc closes modals)
- Focus management: modals should trap focus and return it on close
- ARIA labels missing on icon-only buttons
- Color contrast verified (WCAG AA via `ON_LIME` etc.) but not screen-reader tested

**Fix:** Run axe-core, add `aria-label`s, use `react-focus-lock` in modals.

### 9. Demo data cleanup

For a new church signing up, all these constants should be empty / nullable:

- `USERS`, `TEAM` — replaced by auth
- `INITIAL_CAMPUSES` — empty array (church creates them in onboarding)
- `MINISTRIES`, `ADMINISTRATORS` — empty
- `INITIAL_RECURRING_PAYMENTS`, `SCHEDULED_EVENTS`, `PAID_EVENTS` — empty
- `ANNUAL_BUDGETS`, `MONTHLY_DONATIONS` — empty
- `RECENT_RECEIPTS`, `INITIAL_ACTIVITY_LOG` — empty
- `INITIAL_CONNECTIONS` — empty (user adds in Integrations)
- `MONTHLY_TREND`, `UTILIZATION_HISTORY`, `FORECAST_HISTORY`, `LAST_MONTH_SPEND` — derived from real data

**Onboarding flow** for new churches:
1. Sign up → create tenant
2. Set church name, address
3. Add first campus (HQ)
4. Invite first admin
5. Connect first donation source (Stripe)
6. Connect QuickBooks
7. Set monthly overhead targets

### 10. Branding cleanup

- File mixes "IRC Church" (customer brand) with "Steward" (product brand). For SaaS launch, customer names should come from tenant data, not hardcoded.
- Repo is `IRC-Church` — fine while customer-specific. For SaaS, fork to `steward-app` with neutral name.

### 11. Bundle size

916KB minified / 232KB gzipped — bigger than ideal. Recharts alone is ~150KB.

**Fix:** Route-based code splitting:
```js
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
```
Wrap in `<Suspense fallback={<Spinner />}>`. Recharts only loads when Reports/Dashboard/Expenses are visited.

### 12. Error monitoring

`PageErrorBoundary` logs to `console.error`. For production:

```js
componentDidCatch(error, info) {
  Sentry.captureException(error, { contexts: { react: info } });
}
```

### 13. Email + notifications

Schedule modal collects emails but sends nothing. Alert thresholds fire in UI but no notification leaves the browser.

**Fix:** Postmark / Resend / SendGrid integration. Triggers:
- Scheduled report → cron job + email with attachment
- Alert threshold breach → email + push
- Invite sent → magic link email
- Budget request → email to HQ admins
- Notification preview modal → actually sends on "Send & apply"

### 14. PDF + CSV generation

Currently client-side. For scheduled reports that email attachments, server-side rendering is needed:

- Puppeteer (heavy but works)
- `@react-pdf/renderer` (React-based, clean)
- ReportLab / WeasyPrint (Python sidecar)

### 15. Payments

Stripe billing portal opens via `window.open` (added this round). Real flow needs:
- Stripe Checkout for sign-up
- Webhook handler for `customer.subscription.updated` etc.
- Tenant `subscriptions` table to gate feature access

### 16. Legal + compliance

For US 501(c)(3) churches:
- Donor year-end statements must include EIN, name, address, deductibility statement
- IRS Form 990 must be filed annually (mostly handled by current 990 worksheet report)
- Kids ministry data: COPPA if under 13
- Payroll integration: W-2/1099 handling

For European churches:
- GDPR: data export + delete on request, consent for tracking
- Cookie banner (we set no cookies currently → not strictly needed yet)

## Recommended path to launch

**Week 1: foundations**
- Supabase project setup
- Auth integration (replace `USERS`)
- Schema migration scripts
- One end-to-end CRUD (e.g., ministries) working from UI through DB

**Week 2: per-table wiring**
- Wire campuses, ministries, payments, donations, events, receipts, connections
- RLS policies per table
- Test with two test tenants for data isolation

**Week 3: ops infrastructure**
- Stripe Checkout + webhook
- Email service (Resend recommended)
- Sentry error monitoring
- Mobile responsive pass
- Onboarding flow for new tenant

**Week 4: polish + launch**
- Empty states everywhere
- Loading states (skeletons or spinners)
- Help docs / first-run tour
- Domain + DNS + SSL
- Beta with 3-5 friendly churches
- Iterate on feedback before public launch

## Quick wins (can do today)

- Run `npm install` to refresh deps
- Add `vercel.json` with SPA rewrite rule
- Connect repo to Vercel free tier — instant preview deploys
- Set up Supabase project (free tier OK for testing)
- Generate schema migration from this doc's table list

---

*Last updated against commit `dcf413a` + the QA round adding ErrorBoundary + 10 dead-button wirings.*
