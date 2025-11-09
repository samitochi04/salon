begin;

create table if not exists salon.operating_settings (
  singleton boolean primary key default true,
  open_time time not null default time '09:00',
  close_time time not null default time '19:00',
  timezone text not null default 'Europe/Paris',
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  check (open_time < close_time)
);

create trigger set_timestamp_operating_settings
before update on salon.operating_settings
for each row
execute procedure public.set_current_timestamp();

create table if not exists salon.closed_days (
  id uuid primary key default gen_random_uuid(),
  closed_on date not null unique,
  reason text,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

comment on table salon.operating_settings is 'Salon-wide operating hours and timezone configuration.';
comment on table salon.closed_days is 'Calendar of one-off closures overriding default business hours.';

commit;


