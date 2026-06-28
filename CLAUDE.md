# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run lint         # ESLint

npx prisma migrate dev          # run migrations
npx prisma db seed              # seed database (uses prisma/seed.ts)
npx prisma studio               # browse DB
```

## Architecture

**CPMAS** — Construction Project Management and Accounting System. Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, PostgreSQL via Prisma 7 + pg driver.

### Auth

Custom JWT (Web Crypto API, not jsonwebtoken) stored in `auth_token` cookie. Web Crypto is used specifically for Edge/Middleware compatibility — do not switch to `jsonwebtoken`.

- `src/lib/auth.ts` — `signJWT`, `verifyJWT`, `getCurrentUser`, `hasRole`
- `src/proxy.ts` — Next.js middleware (file was renamed from `src/middleware.ts`; still exports `config` matcher). Handles route protection and role-based redirects.

RBAC hierarchy (numeric, higher = more access):

```
SUPER_ADMIN(4) > ADMIN(3) > ACCOUNTANT(2) > PROJECT_MANAGER(1) > DATA_ENTRY_OPERATOR(0)
```

### Database

Prisma 7 with `@prisma/adapter-pg` (PgAdapter pattern). Do **not** use the default Prisma driver.

- `src/lib/db.ts` — singleton Prisma client with PgAdapter; import `prisma` from here everywhere
- `prisma/schema.prisma` — schema
- `prisma/seed.ts` — creates default users (one per role, password `Password123!`) and sample data

### State / Data Fetching

All server data goes through RTK Query. No direct `fetch` calls in components.

- `src/store/api/cpmasApi.ts` — single `cpmasApi` with all endpoints; all types live here too
- `src/store/index.ts` + `src/store/StoreProvider.tsx` — Redux store setup
- Use exported hooks (`useGetProjectsQuery`, `useCreateProjectMutation`, etc.) in components

### API Routes

All routes under `src/app/api/`. Pattern:
1. Call `getCurrentUser()` — return 401 if null
2. Check role with `hasRole()` or inline role check — return 403 if insufficient
3. Validate input manually (no Zod on server side yet)
4. Write `auditLog` entry on mutations
5. Use `getPaginationParams` / `formatPaginatedResponse` from `src/lib/pagination.ts` on list endpoints

### Forms / Validation

All Zod schemas in `src/lib/schemas/index.ts`. Forms use `react-hook-form` + `@hookform/resolvers/zod`.

### UI Components

Custom primitives in `src/components/ui/` — `Modal`, `Drawer`, `AlertDialog`, `DatePickerInput`, `Pagination`, `ToastContainer`. Use these; do not reach for an external UI library.

Toast state managed via `src/hooks/useToast.ts`. Auth state via `src/context/AuthContext.tsx` + `src/store/slices/authSlice.ts`.
