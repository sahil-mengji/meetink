# Meet Ink Frontend

Production-ready React starter with:
- React Router (data router)
- Motion (`motion/react`) page transitions
- TanStack Query + Axios API client
- Zustand persisted UI store
- Global and route-level error boundaries
- shadcn/ui components + Sonner toast
- SPA `_redirects` for static hosts

## Environment

Create `.env` from `.env.example`.

```bash
copy .env.example .env
```

## Scripts

```bash
pnpm install
pnpm dev
pnpm run typecheck
pnpm run lint
pnpm run build
```

## Structure

```
src/
	components/
		errors/
		ui/
	lib/
		api/
		env.ts
		query-client.ts
	pages/
	providers/
	router/
	store/
```

## API Base URL

The frontend reads `VITE_API_BASE_URL` and defaults to:

```
http://localhost:8000/api/v1
```
