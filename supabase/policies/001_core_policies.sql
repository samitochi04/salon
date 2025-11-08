-- Enable Row Level Security
alter table salon.services enable row level security;
alter table salon.staff enable row level security;
alter table salon.staff_services enable row level security;
alter table salon.availability_blocks enable row level security;
alter table salon.bookings enable row level security;
alter table salon.booking_notes enable row level security;
alter table salon.notification_log enable row level security;

-- Service catalog visible to everyone
create policy "Public can read active services"
  on salon.services
  for select
  using (active is true);

-- Staff directory and availability only for authenticated staff
create policy "Staff members can read roster"
  on salon.staff
  for select
  using (exists (
    select 1
    from salon.staff permitted
    where permitted.auth_user_id = auth.uid()
  ));

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

