# Server Architecture Overview

## Tech Stack
- Node.js + Express.js for RESTful + HTMX-friendly endpoints
- Supabase client SDK for database access and auth integration
- Resend SDK for transactional email delivery

## High-Level Structure
- `src/`
  - `app.js` – Express bootstrap, middleware, routes mounting
  - `config/` – environment loading, Supabase client factory, mail transport
  - `routes/` – route modules grouped by domain (public booking, admin dashboard, health)
  - `controllers/` – route handlers returning HTML fragments or JSON
  - `services/` – business logic (booking orchestration, email notifications)
  - `repositories/` – Supabase queries encapsulated with RLS-safe patterns
  - `middlewares/` – auth guards, input validation, rate limiting
  - `views/` – HTMX-ready templates (if using server-side rendering)
  - `utils/` – helper functions shared across layers
- `tests/` – integration & unit tests (Jest or Vitest)

## Operational Concerns
- `cross-env` + dotenv for local env management; production secrets from managed store
- Helmet, morgan, CORS configuration, and request logging
- Centralized error handling with HTMX-aware JSON responses (decorated later with fragments)

### Commands
- `npm run dev` – start nodemon with live reload
- `npm run start` – production boot
- `npm run lint` / `lint:fix` – ESLint (Airbnb-lite + Prettier)
- `npm run format` / `format:fix` – Prettier consistency

