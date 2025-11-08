# Supabase Setup (Radiant Bloom Salon)

## Prerequisites
- Install the Supabase CLI: `npm install -g supabase`
- Authenticate: `supabase login`
- Link to your project: `supabase link --project-ref <project-ref>`

## Local Workflow
1. `supabase init` (once) to scaffold the config files.
2. Place SQL migrations under `supabase/migrations`. Each migration is executed in order with `supabase db push`.
3. Keep Row Level Security (RLS) policies versioned in `supabase/policies` and apply them with `psql` or `supabase db push --file`.
4. Use `supabase db pull` sparingly to avoid overwriting hand-written migrations.

## Environments
- **Development:** run `supabase start` for a local Postgres + Studio environment.
- **Staging/Production:** deploy migrations via CI/CD using `supabase db push --project-ref`.

## Recommended Extensions
- `pgcrypto` for `gen_random_uuid()`
- `postgis` (optional) if geo queries are required later

## RLS Principles
- Enable RLS on every table.
- Prefer using a service-role key on the backend where server logic acts on behalf of the customer.
- Expose limited views to anonymous clients (e.g., public service catalog) by creating Postgres views with explicit RLS policies.
- Keep policies small and composable, and include tests (see `supabase/tests` placeholder).

## Mail Delivery
- Confirmation and admin notification emails are sent from the server via Resend.
- For high reliability, consider storing outbound email logs in a dedicated table (`notification_log`) with light-weight policies.

