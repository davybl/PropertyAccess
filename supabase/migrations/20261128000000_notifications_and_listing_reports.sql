create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  action_url text,
  is_read boolean not null default false,
  reference_id uuid,
  event_key text,
  created_at timestamptz not null default now()
);

alter table public.notifications
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists type text,
  add column if not exists title text not null default 'Notification',
  add column if not exists message text not null default '',
  add column if not exists action_url text,
  add column if not exists is_read boolean not null default false,
  add column if not exists reference_id uuid,
  add column if not exists event_key text,
  add column if not exists created_at timestamptz not null default now();

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create unique index if not exists notifications_event_unique_idx
  on public.notifications (user_id, type, reference_id, event_key);

alter table public.notifications enable row level security;
grant select on public.notifications to authenticated;
revoke update on public.notifications from authenticated;
grant update (is_read) on public.notifications to authenticated;
grant all on public.notifications to service_role;

drop policy if exists "Users can read their notifications"
  on public.notifications;
create policy "Users can read their notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can update their notifications"
  on public.notifications;
create policy "Users can update their notifications"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create table if not exists public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (
    reason in (
      'broker_agent',
      'already_rented',
      'wrong_price_info',
      'scam_suspected',
      'other'
    )
  ),
  details text check (details is null or char_length(details) <= 1000),
  status text not null default 'open' check (
    status in ('open', 'reviewed', 'dismissed', 'archived')
  ),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists listing_reports_status_created_idx
  on public.listing_reports (status, created_at desc);

alter table public.listing_reports enable row level security;
grant select, insert, update on public.listing_reports to authenticated;
grant all on public.listing_reports to service_role;

drop policy if exists "Tenants can report listings"
  on public.listing_reports;
create policy "Tenants can report listings"
  on public.listing_reports for insert
  to authenticated
  with check (
    reporter_id = auth.uid()
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'tenant'
    )
  );

drop policy if exists "Admins can read listing reports"
  on public.listing_reports;
create policy "Admins can read listing reports"
  on public.listing_reports for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

drop policy if exists "Admins can update listing reports"
  on public.listing_reports;
create policy "Admins can update listing reports"
  on public.listing_reports for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;
