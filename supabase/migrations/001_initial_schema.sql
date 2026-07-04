Hellocreate table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  company_option text,
  custom_company text,
  pay_rate numeric not null,
  hours_worked numeric not null,
  tax_code text not null,
  income_bracket_key text,
  holiday_pay boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists shifts_user_id_idx on public.shifts(user_id);
create index if not exists shifts_date_idx on public.shifts(date);
create index if not exists shifts_user_id_date_idx on public.shifts(user_id, date);

-- Row Level Security
alter table public.shifts enable row level security;

create policy "Users can view their own shifts"
  on public.shifts
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own shifts"
  on public.shifts
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own shifts"
  on public.shifts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own shifts"
  on public.shifts
  for delete
  using (auth.uid() = user_id);
