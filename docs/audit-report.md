# SocialNova — Audit Report & Fix Plan

**Date:** 2026-08-09
**Status:** P0 CHAT + SECURITY FIXES COMPLETE (2026-08-10) — P1 remaining.

**P0 resolution status:**
1. ✅ Chat reworked end-to-end: NovaAgent persona + routing + offline fallback (`agents/nova.py`), real `ChatResponse` fields (`routes/chat.py`), `ChatMessage` persistence (`models.py`), OpenRouter client returns `None` without key (`services/openrouter.py`).
2. ✅ Forgot-password no longer leaks token — wires `send_password_reset_email`, generic response only. Test asserts `detail is None`.
3. ✅ Added `apps/web/app/api/health/route.ts` → `{status:"ok"}`. Verified live on :3000.
4. ✅ `SECRET_KEY` startup guard: `Settings.has_secure_secret_key()` + fail-fast `RuntimeError` in prod lifespan when key is default/empty (`config.py`, `main.py`).
5. ✅ Stripe webhook fail-closed: 503 when `STRIPE_WEBHOOK_SECRET` unset, never unverified parsing; UUID cast fix in `_handle_checkout_completed` (`routes/webhooks.py`).
- Backend suite: **247 passed** (added `tests/unit/test_nova.py` 11, `tests/unit/test_config.py` 5, `tests/integration/test_webhooks.py` 1).

---

## Session Runtime Facts (confirm before starting)

- Repo: `C:\WebWorka\experiments\socialnova` (NOT a git repo — `git init` never run).
- Backend: FastAPI, runs detached via `cmd /c` wrapper on `127.0.0.1:8010`
  - Start: `Start-Process cmd -ArgumentList '/c','uvicorn main:app --host 127.0.0.1 --port 8010 > "C:\Users\WebWorka\AppData\Local\Temp\opencode\srv-api.log" 2>&1' -WorkingDirectory "C:\WebWorka\experiments\socialnova\apps\api" -WindowStyle Hidden`
  - Python is installed GLOBALLY (not venv for runtime; `apps/api/venv` exists but unused).
- Frontend: Next.js dev on `:3000`, log at `%TEMP%\opencode\web-dev.log`.
- Postgres 18.1 `localhost:5432`, db `socialnova`, user/pass `postgres`/`postgres`.
- Test user: `pg@test.com` / `Pg123456!` (superadmin).
- Canonical agent count is 12 — `AGENT_REGISTRY` in `apps/api/agents/__init__.py`.
- `initial pg` — raw string may break: DO NOT search mb64, already restored.

---

## P0 — Ship blockers (fix first)

1. **Chat endpoint always 500s** — `apps/api/routes/chat.py:37-42`
   - `ChatResponse` (schemas.py:406-412) requires `response`, `agent_used`, `conversation_id`.
   - Route returns `model_used`/`cost_cents` (not schema fields) and omits `agent_used`/`conversation_id` → Pydantic ValidationError → 500.
   - Also `/chat/completions` (chat.py:54-57) references `request.model`/`request.tier` which don't exist on `ChatRequest` (schemas.py:399-403).
   - Second layer: `services/openrouter.py:42` sends `Authorization: Bearer {key}`; with empty `OPENROUTER_API_KEY` the header is `Bearer ` → httpx "Illegal header value" live error. Need a real key or graceful no-key fallback.
   - FIX: rewrite both handlers to return real schema fields; add `model`/`tier` to `ChatRequest`; guard empty API key.

2. **Forgot-password leaks live reset token** — `apps/api/routes/auth.py:195-198`
   - Verified live: `POST /auth/forgot-password {email: pg@test.com}` returns `detail=<valid token>` → full account takeover.
   - FIX: remove `detail=token`; wire `services/email.py` (currently dead code) or return generic message only. Single-use reset tokens + per-endpoint rate limit.

3. **Missing web `/api/health`** — `apps/web/app/api/` has only `v1/chat/route.ts`.
   - Docker healthchecks (`docker-compose.yml:155`, `web Dockerfile:95`, prod `:187`) curl `/api/health` → container always unhealthy → nginx never starts in prod.
   - FIX: add `apps/web/app/api/health/route.ts` returning `{status:"ok"}`.

4. **SECRET_KEY is public default `change-me-in-production`** — `config.py:52`, `.env:17`.
   - FIX: rotate secret; fail-fast at startup when `APP_ENV == "production"` and secret is default/weak. Delete dead `JWT_SECRET`/`JWT_ALGORITHM` (config.py:56-57).

5. **Stripe webhook unverified when secret empty** — `routes/webhooks.py:34-54`
   - FIX: fail closed — require `STRIPE_WEBHOOK_SECRET` in prod; never fall back to unverified parsing.
   - Also `webhooks.py:93`: `User.id == user_id` compares UUID column vs `str` → asyncpg DataError; cast `UUID(user_id)` in try/except.

---

## P1 — Core product wiring

6. **Frontend never talks to backend**:
   - `apps/web/app/api/v1/chat/route.ts:6-8` is `// TODO: Connect to Python backend` mock. Login (`login/page.tsx:24-27`) is a simulated timer, no JWT stored, no Bearer ever sent.
   - FIX: wire login → `POST /auth/login`, store token securely (httpOnly cookie recommended), add fetch wrapper; make chat route proxy to backend or use `rewrites()` in `next.config.ts` (beware path shadowing — both are `/api/v1/chat`).

7. **Agent count claim**: README says 16, code says 12. Standardize on 12 (README.md:3, :78). Also "6 core agents" (README:61) vs 6+6.

8. **Rate limiter bypass** — `middleware/rate_limit.py:45,108-114`: trust IP from `X-Forwarded-For` without validation → use `request.client.host` or trusted proxy chain; bound memory (LRU/Redis).

9. **`content` metadata updates silently dropped** — `content.py:146-148` does `setattr(content, "metadata", …)` but DB column is named `metadata`, model attr is `extra_data` (models.py:155). Map before setattr.

10. **AI endpoints unauthenticated** — `/api/v1/chat`, `/support/*`, `/gtm/*` (incl. `/gtm/admin/auto-generate`) → add `Depends(get_current_user)`.

11. **Nginx prefixes mismatch** — `config/nginx/conf.d/socialnova.conf:58-80` proxies only `/api/`; real prefixes `/auth`, `/users`, `/agents`, `/content`, `/campaigns`, `/webhooks`, `/uploads`, `/search`, `/admin`, `/support`, `/gtm`. Real login rate-limit regex targets wrong prefixes too.

---

## P2 — Orphans & cleanup (verified safe)

- `apps/api/agents/factory/generator.py` + `templates/*.yaml` — dead code. Keep ONLY if wiring Agent Factory; else delete.
- `apps/api/services/email.py` — orphan (used if fixing P0#2).
- `apps/api/logging_config.py` — orphan.
- `apps/web/components/ui/tabs.tsx`, `ui/skeleton.tsx`, `marketing/features.tsx`, `marketing/cta.tsx`, `lib/faq-data.ts` — dead imports.
- `config/nginx/default.conf`, `scripts/db/seed.sh`, `scripts/db/restore.sh` — orphaned.
- `nextjs.log`, `apps/web/next-dev-err.log`, `apps/api/uploads/{2092e7615e80-note.txt,a2aa92c4badd-final.txt}` — junk, gitignore `*.log`.
- Dead link 404s: navbar `/features`,`/pricing`,`/about`; footer `/blog`,`/api`,`/privacy`,`/terms`, etc; sidebar `/inbox`,`/help`. Points to missing routes.
- Duplicates: `marketing/stats.tsx` vs `marketing/social-proof.tsx` (same numbers twice) → consolidate.

---

## Product vs Concept Blockers (deferred)

- 16 agents claimed → 12 exist. Decide: add 4 or fix copy.
- 14+ platforms claimed → 6 implemented (webhooks whitelist + all MKT copy). Real publishing is a status flip with `# TODO: Integrate with social media platform APIs` (content.py:220). No scheduler.
- Social CRM missing (no Contact/Lead model; ConnectorAgent is text-only).
- Engagement Score/Achievements/Leaderboard/Notifications/Weekly Digest/Predictions — all hardcoded frontend mocks, no backend.
- pgvector claimed, zero vector usage.
- Marketing fabrications (SOC2, 24K creators, Vogue/Forbes logos, testimonials) — MKT copy only.

---

## Resume checklist (when session reconvenes)

1. Confirm ports: backend :8010 (restart if needed), frontend :3000.
2. Start with P0 #1–5; re-verify chat + forgot-password live after fixes.
3. Then P1 #6–11.
4. Optionally `git init` (repo is not a git repo).