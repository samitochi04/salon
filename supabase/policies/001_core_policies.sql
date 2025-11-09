-- Enable Row Level Security
alter table salon.services enable row level security;
alter table salon.staff enable row level security;
alter table salon.staff_services enable row level security;
alter table salon.availability_blocks enable row level security;
alter table salon.bookings enable row level security;
alter table salon.booking_notes enable row level security;
alter table salon.notification_log enable row level security;
alter table salon.operating_settings enable row level security;
alter table salon.closed_days enable row level security;

-- Service catalog visible to everyone
create policy "Public can read active services"
  on salon.services
  for select
  using (active is true);

create policy "Staff can read full service catalog"
  on salon.services
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from salon.staff permitted
      where permitted.auth_user_id = auth.uid()
    )
  );

-- Les membres du staff peuvent créer / modifier / désactiver des services
create policy "Staff can manage services"
  on salon.services
  for all  -- (insert, update, delete)
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from salon.staff permitted
      where permitted.auth_user_id = auth.uid()
    )
  )
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1
      from salon.staff permitted
      where permitted.auth_user_id = auth.uid()
    )
  );

-- Staff directory and availability only for authenticated staff
create policy "Staff members can read roster"
  on salon.staff
  for select
  using (
    auth.role() = 'service_role'
    or auth.uid() is not null
  );

create policy "Staff can manage availability"
  on salon.availability_blocks
  for all
  using (
    exists (
      select 1
      from salon.staff permitted
      where permitted.id = salon.availability_blocks.staff_id
        and permitted.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from salon.staff permitted
      where permitted.id = salon.availability_blocks.staff_id
        and permitted.auth_user_id = auth.uid()
    )
  );

create policy "Staff can read availability roster"
  on salon.availability_blocks
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from salon.staff permitted
      where permitted.auth_user_id = auth.uid()
    )
  );

-- Operating hours
create policy "Staff can read operating settings"
  on salon.operating_settings
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from salon.staff permitted
      where permitted.auth_user_id = auth.uid()
    )
  );

create policy "Staff can manage operating settings"
  on salon.operating_settings
  for all
  using (
    exists (
      select 1
      from salon.staff permitted
      where permitted.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from salon.staff permitted
      where permitted.auth_user_id = auth.uid()
    )
  );

-- Closure overrides
create policy "Staff can read closed days"
  on salon.closed_days
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from salon.staff permitted
      where permitted.auth_user_id = auth.uid()
    )
  );

create policy "Staff can manage closed days"
  on salon.closed_days
  for all
  using (
    exists (
      select 1
      from salon.staff permitted
      where permitted.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from salon.staff permitted
      where permitted.auth_user_id = auth.uid()
    )
  );

-- Bookings
create policy "Admins can manage bookings"
  on salon.bookings
  for all
  using (
    exists (
      select 1
      from salon.staff permitted
      where permitted.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from salon.staff permitted
      where permitted.auth_user_id = auth.uid()
    )
  );

create policy "Customer can read own booking via token"
  on salon.bookings
  for select
  using (
    auth.role() = 'anon'
    and current_setting('request.jwt.claims', true)::jsonb ? 'booking_token'
    and current_setting('request.jwt.claims', true)::jsonb ->> 'booking_token' = public_token::text
  );

-- Booking notes
create policy "Staff only booking notes"
  on salon.booking_notes
  for all
  using (
    exists (
      select 1
      from salon.staff permitted
      where permitted.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from salon.staff permitted
      where permitted.auth_user_id = auth.uid()
    )
  );

-- Notification log read-only internally
create policy "Staff can read notifications"
  on salon.notification_log
  for select
  using (
    exists (
      select 1
      from salon.staff permitted
      where permitted.auth_user_id = auth.uid()
    )
  );

