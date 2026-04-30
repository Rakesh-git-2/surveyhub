# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SurveyHub is a full-stack survey platform:
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript — in `surveyhub-frontend/`
- **Backend**: Django 5.1 + Django REST Framework + SimpleJWT — in `surveyhubbackend/`
- **Database**: PostgreSQL (must be set up manually before running the backend)

## Development Commands

### Frontend (`surveyhub-frontend/`)

```bash
bun install          # Install dependencies
bun dev              # Dev server at http://localhost:3000
bun build            # Production build
bun lint             # ESLint
```

### Backend (`surveyhubbackend/`)

```bash
source venv/bin/activate
python manage.py runserver          # Dev server at http://localhost:8000
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

### Database Setup (first time)

The backend requires a PostgreSQL database. Create it before running migrations:

```sql
CREATE DATABASE surveyhub;
CREATE USER surveyhubuser WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE surveyhub TO surveyhubuser;
```

Then update the credentials in `surveyhubbackend/surveyhubbackend/settings.py` and run `python manage.py migrate`.

## Architecture

### Frontend

Pages live in `src/app/` using Next.js App Router. The root layout (`src/app/layout.tsx`) wraps everything in `AuthProvider` and renders a persistent `Navbar`.

**Implemented pages** (real functionality, wired to backend):
- `/auth` — Login/signup with JWT
- `/dashboard` — Survey list, delete, stats
- `/survey-creation` — Survey builder with dynamic questions and choices
- `/survey-response/[id]` — Submit a response
- `/survey-report/[id]` — Analytics with bar charts and CSV export
- `/survey-distribution/[id]` — Shareable link, embed code, QR code
- `/admin-panel` — Staff-only admin dashboard

**Stub pages** (show "Coming Soon", not wired to any backend):
`/ai-recommendations`, `/ai-survey-generation`, `/advanced-reporting`, `/conversational-ai`, `/engagement-metrics`, `/integrations`, `/mobile-app`, `/multi-language`, `/notifications`, `/performance`, `/role-management`, `/user-management`

**Shared infrastructure:**
- `src/api/api.js` — `apiRequest()`: native `fetch` wrapper; auto-attaches `Bearer` token from `localStorage`; throws on non-2xx
- `src/hooks/useApi.js` — `useApi()` hook: wraps `apiRequest` with `loading/error/data` state
- `src/context/authContext.js` — `AuthProvider` + `useAuth()`: stores `token`, `refreshToken`, and `user` in `localStorage`; dispatches `LOGIN`/`LOGOUT`/`INIT_DONE`
- `src/components/ui/` — Shared UI primitives: `Button`, `Card`, `Input`, `Modal`, `Toast`, `Loading`
- `src/app/colors.css` — CSS custom properties for light/dark theming; dark mode via `.dark` class on `<html>`

### Backend

Single Django app `surveys` under `surveyhubbackend/surveys/`.

**Models**: `Survey → Question → Choice` (survey definition tree); `Response → Answer` (submission tree). `Survey.allow_anonymous` controls whether unauthenticated responses are accepted.

**API endpoints** (all prefixed `/api/`):

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `auth/register/` | None | Register, returns JWT pair |
| POST | `auth/login/` | None | Login, returns JWT pair |
| GET/PATCH | `auth/user/` | Required | Profile |
| POST | `auth/change-password/` | Required | Change password |
| GET/POST | `surveys/` | Required | List/create surveys |
| GET/PUT/DELETE | `surveys/<id>/` | Required | Survey detail |
| GET/POST | `surveys/<pk>/questions/` | Required | Questions for a survey |
| PUT/DELETE | `surveys/<pk>/questions/<id>/` | Required | Question detail |
| POST | `surveys/<pk>/responses/` | None | Submit response (anonymous allowed) |
| GET | `surveys/<pk>/responses/list/` | Required | List responses |
| GET | `admin/stats/` | Staff only | Dashboard stats |

JWT tokens are issued by the custom `auth/login/` and `auth/register/` views (not by `/api/token/`). The `/api/token/` and `/api/token/refresh/` SimpleJWT endpoints are also available.

**Serializers**: `SurveySerializer` (read, includes nested questions+choices+creator) vs `SurveyCreateSerializer` (write, flat fields only). `ResponseSerializer` creates nested `Answer` records in one call.

**No tests exist yet** — `surveys/tests.py` is empty.

## Key Constraints

- The frontend API client (`src/api/api.js`) uses native `fetch`, **not axios**.
- JWT access token is stored in `localStorage` under the key `token`; refresh token under `refreshToken`.
- `SurveyDetailView` uses `SurveySerializer` (read serializer) for both GET and PUT — updating a survey via PUT will not accept nested questions in the request body.
- `settings.py` has `ALLOWED_HOSTS = []` and `DEBUG = True`; the `SECRET_KEY` is hardcoded — these must be changed before any deployment.
- CORS is configured for `localhost:3000` only.
