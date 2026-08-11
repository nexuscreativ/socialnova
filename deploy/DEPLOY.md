# SocialNova — Fly.io Deployment Playbook

Two Fly apps (`socialnova-api` on :8000, `socialnova-web` on :3000) with a
managed Postgres cluster and a persistent volume for CMS uploads.

## Prerequisites

- Fly CLI installed: `C:\Users\WebWorka\.fly\bin\flyctl.exe`
- Logged in: `flyctl auth status`

## 1. Create the Postgres cluster (one-time)

```powershell
& "C:\Users\WebWorka\.fly\bin\flyctl.exe" postgres create --name socialnova-db `
  --region iad --vm-size shared-cpu-1x --volume-size 10 --password <STRONG-DB-PASSWORD>
```

This creates a separate `socialnova-db` app. Note its internal connection
string (shown at the end, or `flyctl postgres connect`).

## 2. Deploy the API

```powershell
cd C:\WebWorka\experiments\socialnova\deploy\api
& "C:\Users\WebWorka\.fly\bin\flyctl.exe" launch --copy-config --no-deploy
& "C:\Users\WebWorka\.fly\bin\flyctl.exe" postgres attach socialnova-db --app socialnova-api
& "C:\Users\WebWorka\.fly\bin\flyctl.exe" volumes create uploads --app socialnova-api --size 1 --region iad
& "C:\Users\WebWorka\.fly\bin\flyctl.exe" secrets set `
  `"DATABASE_URL=<internal-connection-string-with-asyncpg>`" `
  `"SECRET_KEY=<64-char-random>`" `
  `"JWT_SECRET=<same or another random>`" `
  `"CORS_ORIGINS=[""https://socialnova-web.fly.dev""]"` `
  `"OPENROUTER_API_KEY=<optional>`" `
  `"STRIPE_SECRET_KEY=<optional>`" `
  `"STRIPE_WEBHOOK_SECRET=<optional>`"
& "C:\Users\WebWorka\.fly\bin\flyctl.exe" deploy
```

> The production startup guard in `main.py` refuses to boot unless
> `SECRET_KEY` is set to a strong random value. Generate with:
> `python -c "import secrets; print(secrets.token_hex(32))"`

`flyctl postgres attach` sets the `DATABASE_URL` secret automatically.

## 3. Deploy the web app

```powershell
cd C:\WebWorka\experiments\socialnova\deploy\web
& "C:\Users\WebWorka\.fly\bin\flyctl.exe" launch --copy-config --no-deploy
& "C:\Users\WebWorka\.fly\bin\flyctl.exe" secrets set NOVA_API_URL=https://socialnova-api.fly.dev
& "C:\Users\WebWorka\.fly\bin\flyctl.exe" scale memory 1024
& "C:\Users\WebWorka\.fly\bin\flyctl.exe" deploy
```

## 4. Verify

- `https://socialnova-api.fly.dev/health` → `{"status": "healthy", ...}`
- `https://socialnova-web.fly.dev/` → landing page
- `https://socialnova-web.fly.dev/pricing` → CMS page
- Sign in at `/login`, open Settings → Content → edit a page → Save/Publish.

## Configuration map

| Web env          | Value                          | Notes                              |
| ---------------- | ------------------------------ | ---------------------------------- |
| `NOVA_API_URL`   | `https://socialnova-api.fly.dev` | SSR fetch + proxy backend origin   |

| API env          | Value                | Notes                              |
| ---------------- | -------------------- | ---------------------------------- |
| `DATABASE_URL`   | (from attach)        | FastAPI asyncpg DSN                 |
| `SECRET_KEY`     | strong random        | Required in production (boot guard) |
| `CORS_ORIGINS`   | `["https://socialnova-web.fly.dev"]` | Web origin only          |
| `UPLOAD_DIR`     | `/data/uploads`      | Fly volume `uploads`                |

## Rollback

```powershell
& "C:\Users\WebWorka\.fly\bin\flyctl.exe" releases list
& "C:\Users\WebWorka\.fly\bin\flyctl.exe" releases rollback <version>
```

## Local review

Before deploying, run everything locally:

- Backend: `python -m uvicorn main:app --port 8010` (from `apps/api`)
- Web: `NOVA_API_URL=http://127.0.0.1:8010 npm run dev` (from `apps/web`)
- Admin login: `pg@test.com` / `Pg123456!`