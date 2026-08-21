# SocialNova — Sprint 2 Workflow

Repo: nexuscreativ/socialnova (branch main)
Deploys: push to main -> GitHub Actions (API first, then web)
Gates per milestone: API `pytest` · web `npm run build` + `npm run lint` ·
Alembic revision per schema change (`create_all` at boot auto-creates new tables)

---

## Milestone 1 — Logout + Admin IA skeleton (no DB change)

- Wire `apps/web/app/api/auth/logout/route.ts` to call backend `/auth/logout`
  (revoke refresh tokens), keep cookie-clear fallback on network failure.
  Add `everywhere` option to `apps/api/routes/auth.py:149-167` (web always
  revokes all).
- Sign-out everywhere:
  - user-menu chevron visible on mobile (`components/layout/user-menu.tsx`)
  - "Sign out" item in mobile sidebar (`components/layout/mobile-sidebar.tsx`)
  - Settings -> Security danger-zone cards (this device / all devices)
  - marketing navbar CTA auth-aware (`components/marketing/navbar.tsx`)
- Split admin monolith (`apps/web/app/(dashboard)/admin/page.tsx`, 676 lines)
  into a sectioned area:
  `/admin` (Overview), `/admin/users`, `/admin/content`, `/admin/brand`,
  `/admin/api`, `/admin/integrations`, `/admin/billing`, `/admin/audit`,
  `/admin/settings` with `adminNav` gating in `sidebar-nav.ts`.

## Milestone 2 — CMS hardening

- `seo` JSON column on `site_pages` (meta_title, meta_description, og_*, 
  canonical_url, robots) + alembic revision.
- Wire `generateMetadata` in `apps/web/app/(marketing)/[...slug]/page.tsx`
  (currently only renders `<CmsPage/>`, no SEO).
- JSON-schema payload validation on save + publish (422s) + caps
  (max_sections ~30, max payload ~200KB, string/list limits).
- Publish + delete -> `require_superadmin` (`site_pages.py:361-366`, `:472-477`).
- Draft-preview route `(preview)/[slug]` (uses existing `?view=draft`),
  media library (`GET/DELETE /uploads`), unified meta+content save,
  `?status=` filter, `POST /site/pages/{slug}/duplicate`.

## Milestone 3 — Brand & Site

- New tables `site_settings` (keyed JSON: brand, navigation, footer, social,
  pricing, announcement, homepage) + `feature_flags`.
- `routes/site_settings.py`: `GET /site/settings/public` (no auth, pruned),
  `GET /site/settings`, `PUT /site/settings/{key}` (per-key pydantic
  validation, audit `settings.update`), flags superadmin-only.
- Idempotent seed from current hardcoded values.
- `/admin/brand` screens: Brand / Navigation / Footer / Pricing /
  Announcements / Feature flags (Tabs + TabPanel).
- Wire navbar, footer, layout, landing pricing to settings — unifies the
  4 divergent pricing sources (CMS "Custom" vs landing $99 vs billing $199
  vs FAQ $25-250) into ONE catalog.

## Milestone 4 — Admin deep-dive

- `GET /admin/users/{id}` (profile, usage, keys, last login) + user detail
  drawer; role + status filters in users table.
- `POST /admin/users/{id}/reset-password` (superadmin).
- `POST /admin/api-keys/{id}/revoke`; `api-usage?group_by=user`;
  time-range pickers (7|30|90d).
- Audit: action filter dropdown, date range, user filter, server-side
  paging, expandable JSON `details`.

## Milestone 5 — Integrations & Services (verify secrets first)

- PREREQ: verify `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `OPENROUTER_API_KEY`, `REDIS_URL` are set in `socialnova-api` Fly secrets
  (needed for M5/M6/M8/M9 end-to-end).
- New `service_registry` table (service_key, name, provider, status,
  last_checked_at, health payload, error) + alembic revision.
- `GET /admin/services` health-checks Stripe / OpenRouter / SMTP / social
  webhooks / uploads / Redis / Postgres; `POST /admin/services/{key}/refresh`.
- `/admin/services` status cards, "Test connection", config-state badges.

## Milestone 6 — Billing & Payments (depends M3 + M5)

- `POST /billing/checkout` (Stripe Checkout Session from unified catalog),
  `GET /billing/portal` (Stripe Customer Portal). Reuse webhook handlers in
  `apps/api/routes/webhooks.py` (already sync `user.tier`).
- Replace static-mock `apps/web/app/(dashboard)/settings/billing/page.tsx`
  with live data (real plan, invoices, portal link).
- `/admin/billing`: MRR, active/canceled/past-due subscribers, failed
  payments 30d, revenue by plan, per-user billing drawer,
  `PATCH /admin/users/{id}/tier` (superadmin, audit-logged).

## Milestone 7 — Block-type registry + polish

- `GET /site/pages/block-types` (API-driven section catalog); editor "Add
  section" + renderer read from it (fallback to current switch).
- Cross-page duplicate/search, `updated_by_email` display, per-section
  inline validation badges.

## Milestone 8 — Full chat upgrade

- Backend: `POST /api/v1/chat/stream` (SSE token streaming via OpenRouter),
  `GET /conversations`, `GET /conversations/{id}/messages`,
  `DELETE /conversations/{id}`.
- Frontend `/chat`: streaming + stop button, conversation sidebar
  (list/rename/resume — fixes history-loss-on-refresh), markdown + citations,
  `agent_used` badge, copy, suggested follow-ups, voice input
  (port `webkitSpeechRecognition` from bubble).
- Wire `components/support/chat-bubble.tsx` to real backend (support agent)
  — remove hardcoded fake `generateAIResponse()`; escalation becomes a real
  contact/ticket action.

## Milestone 9 — Full PWA + push

- `manifest.webmanifest`, 192/512 + maskable icons, `theme-color`,
  apple-touch-icon, `display: standalone`.
- Service worker (Workbox via next-pwa or hand-rolled): precache static
  assets, network-first pages, offline shell. Reconcile with existing
  `no-store` headers in `next.config.ts` (cache assets, never stale HTML).
- Web Push: `POST /push/subscribe` (store subscription + user_id),
  admin broadcast endpoint, event-triggered pushes (mention/DM, scheduled
  post published, post failed, campaign result).

## Milestone 10 — Real-time events (SSE)

- `GET /api/v1/events` SSE channel -> dashboard + notifications center;
  live inbox/mentions + agent activity feed; push-trigger source for M9.

---

## Role map

| Capability | admin | superadmin |
|---|---|---|
| View admin / stats / usage / audit | yes | yes |
| CMS create / edit / save draft | yes | yes |
| CMS publish / delete | no | yes |
| Users: activate/deactivate | yes | yes |
| Users: change role / reset password | no | yes |
| Brand & Site settings | yes | yes |
| Feature flags / system settings | no | yes |
| Billing / integrations view | yes | yes |
| Tier override / service config / push broadcast | no | yes |

## Backlog (post-M10)

- Notifications center in dashboard
- Cmd+K command palette
- Content A/B testing + approval workflow
- Rich SVG analytics (no new UI libs)
- CSV/JSON export (content, analytics, users)
- Onboarding tour
- Public API reference page in admin (Swagger at `/docs`)
- i18n
