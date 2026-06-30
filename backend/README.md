# Meet Ink Backend

Backend API runs locally and connects to Neon PostgreSQL.

## Run Backend Locally

Activate your virtual environment and run:

```bash
copy .env.example .env
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Health Endpoints

- GET /health
- GET /health/db

## Database URL

The backend requires `DATABASE_URL` from environment variables.
Set it in `backend/.env` or in your shell:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
```
