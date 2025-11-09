-- Autoriser l’utilisation du schéma aux rôles de Supabase
grant usage on schema salon to anon, authenticated, service_role, postgres;

-- Donner les droits complets au rôle service_role (clé service côté backend)
grant all privileges on all tables in schema salon to service_role;
grant all privileges on all sequences in schema salon to service_role;

-- Permettre à l’utilisateur public (anon) de lire le catalogue des services
grant select on salon.services to anon;

-- Optionnel : s’assurer que de futurs objets héritent de ces droits
alter default privileges in schema salon grant all privileges on tables to service_role;
alter default privileges in schema salon grant select on tables to anon;
alter default privileges in schema salon grant usage on sequences to service_role;