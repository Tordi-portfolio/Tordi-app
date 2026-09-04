# Tordi — React + Django REST Framework

WhatsApp-style chat: React (Vite) frontend, Django REST Framework API
backend, installable as an app on Android and iPhone from the browser
(PWA). **Phone number + password** login — no OTP, no email verification,
no SMTP dependency at all for the core app to work. Email is optional and
linked later from Settings, purely as a contact field.

## Project layout

```
backend/     Django REST Framework API (accounts, chat, status apps)
frontend/    React app (Vite) — installable as a PWA on iOS + Android
```

## Running it locally

Two terminals.

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # defaults are fine for local dev
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`. `vite.config.js` proxies `/api` and
`/media` to the backend automatically — no config needed for local dev.

## How auth works

- `POST /api/accounts/register/` — `{phone_number, password}` → creates
  the account and logs you straight in (returns a token immediately, no
  verification step).
- `POST /api/accounts/login/` — `{phone_number, password}` → token.
- Token is stored in `localStorage` and sent as `Authorization: Token
  <token>` on every request (see `src/api/client.js`).
- Email is entirely optional, added later from Settings
  (`PATCH /api/accounts/me/email/`), with no verification — just a
  plain field for now.

Password rules (Django's built-in validators, in `settings.py`):
minimum 8 characters, not a commonly-used password, not entirely numeric.

## Installing as an app

**Android (Chrome):** open the site, log in, and either tap the
"⬇ Install Tordi" button that appears (bottom-right) or use Chrome's own
install icon in the address bar.

**iPhone/iPad (Safari):** iOS has no automatic install prompt API — the
app shows a banner with instructions instead: tap **Share ⬆**, then
**Add to Home Screen**. This is the only way to install a PWA on iOS;
there's no button that can trigger it programmatically.

**Requirement either way:** the install option only appears over
**HTTPS** (or `localhost` during dev) — once deployed, this works
automatically since Render gives you HTTPS by default.

## Deploying — Render (both frontend and backend)

### 1. Backend
1. Generate a real secret key: `python -c "import secrets; print(secrets.token_urlsafe(50))"`
2. Push this project to GitHub.
3. On Render: **New → Web Service**, connect the repo, set:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
   - Start Command: `gunicorn tordi.wsgi:application`
4. Add environment variables: `SECRET_KEY`, `DEBUG=false`,
   `ALLOWED_HOSTS=your-service.onrender.com`. Leave `CORS_ALLOWED_ORIGINS`
   for now.
5. Deploy.

### 2. Frontend
1. Locally: `cd frontend && echo "VITE_API_BASE_URL=https://your-service.onrender.com" > .env.production && npm run build`
2. On Render: **New → Static Site**, same repo, Root Directory `frontend`,
   Build Command `npm run build`, Publish Directory `dist`.
3. Add a rewrite rule: `/*` → `/index.html` (Rewrite) — required so
   React Router's client-side routes don't 404 on refresh.
4. Deploy — note the URL Render gives you.

### 3. Connect them
Back on the backend service's environment variables, set:
```
CORS_ALLOWED_ORIGINS=https://your-frontend.onrender.com
```
Save (triggers a redeploy), then test the whole flow on the frontend URL.

**Render free tier caveat:** the filesystem is ephemeral — every
redeploy/restart wipes uploaded avatars/photos/videos and the SQLite
database. Fine for testing and demos; for anything real, add a paid
persistent disk or move file storage to S3-compatible storage, and the
database to a managed Postgres instance (Render offers this).

## What's simplified vs a "real" production app

- **Polling, not WebSockets** for chat — refreshes every ~2.5s
  (`ChatRoom.jsx`). Works on any host, no special server requirements.
- **In-memory cache** for typing indicators/online status — fine for a
  single server process; switch to Redis if you ever scale to multiple
  workers.
- **No group chats**, 1-on-1 only.
- **25MB upload cap**, no compression, on both chat attachments and
  Status media.
