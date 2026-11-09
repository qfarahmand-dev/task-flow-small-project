# TaskFlow

TaskFlow uses a Next.js frontend and a Django REST API with PostgreSQL. Supabase is no longer used.
Supabase accounts and tasks are not copied automatically; export/import existing data before switching if the Supabase project contains production records.

## Run locally

1. In `Backend`, create a virtual environment and install `requirements.txt`.
2. From a PowerShell terminal in `Backend`, set `DJANGO_DEBUG=true`, `DJANGO_SECRET_KEY` to a local-only value, `CORS_ALLOWED_ORIGINS=http://localhost:3000`, and `FRONTEND_URL=http://localhost:3000`. To use PostgreSQL, also set `DATABASE_URL` to your local database; otherwise Django uses SQLite.
3. Run `python manage.py migrate` and `python manage.py runserver`.
4. From the repository root, copy `.env.example` to `.env.local`, install dependencies with pnpm, and run `pnpm dev`.

The API defaults to `http://localhost:8000/api`; the frontend defaults to that same URL in development. `.env.example` files are templates; Railway variables and local shell variables must be set explicitly.
Run the backend API tests from `Backend` with `python manage.py test`.

## Deploy to Railway

The frontend repository is already connected to GitHub. The backend has its own local Git repository under `Backend`; add a separate remote to that repository before deploying it from a Git host.

Deploy each service from its own Git repository:

1. Add a PostgreSQL service to the Railway project.
2. Create a Django service from the backend repository. Set its **Root Directory** to `/`.
3. Add `DATABASE_URL` to the Django service, referencing the PostgreSQL service's `DATABASE_URL`.
4. Set `DJANGO_SECRET_KEY` to a long, random secret. Set `DJANGO_DEBUG=false`.
5. Set `FRONTEND_URL` to the public frontend URL and `CORS_ALLOWED_ORIGINS` to that exact origin, including `https://` and without a trailing slash. Add the Railway API domain to `ALLOWED_HOSTS` if it is not covered by `.up.railway.app`.
6. Configure an SMTP provider on the Django service (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`, and `DEFAULT_FROM_EMAIL`) to enable password reset emails.
7. Create a Next.js service from the frontend repository and set its **Root Directory** to `/`. Set `NEXT_PUBLIC_API_URL` to the public Django URL ending in `/api`.
8. Generate a public domain for both services. Redeploy after setting environment variables.

Railway configuration files provide install/build/start commands and health checks. Django runs database migrations before starting Gunicorn. Use the `api/health/` endpoint to confirm API availability.

## API

- `POST /api/auth/register/`, `POST /api/auth/token/`, `POST /api/auth/token/refresh/`
- `GET /api/auth/me/`, `POST /api/auth/logout/`
- `POST /api/auth/password-reset/`, `POST /api/auth/password-reset/confirm/`
- `GET|POST /api/tasks/`, `GET|PATCH|DELETE /api/tasks/<uuid>/`

Task endpoints require a JWT bearer token and only return or modify the authenticated user's tasks.
