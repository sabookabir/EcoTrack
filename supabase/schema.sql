-- Enable UUID generation extension
create extension if not exists "uuid-ossp";

-- 1. USERS TABLE (Linked to auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  college_name text,
  city text,
  points integer default 0,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on users
alter table public.users enable row level security;

-- Users RLS Policies
create policy "Allow public read access to basic profile info" on public.users
  for select using (true);

create policy "Allow users to update their own profile" on public.users
  for update using (auth.uid() = id);

-- Trigger to sync auth.users with public.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, role, points, college_name, city)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    0,
    coalesce(new.raw_user_meta_data->>'college_name', ''),
    coalesce(new.raw_user_meta_data->>'city', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. CARBON ENTRIES TABLE
create table public.carbon_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  entry_date date not null,
  transport_car numeric default 0,
  transport_bike numeric default 0,
  transport_bus numeric default 0,
  transport_train numeric default 0,
  transport_walking numeric default 0,
  electricity_kwh numeric default 0,
  food_habit text not null check (food_habit in ('vegetarian', 'mixed', 'non-vegetarian')),
  shopping_habits text not null check (shopping_habits in ('low', 'moderate', 'high')),
  waste_kg numeric default 0,
  total_co2_kg numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, entry_date)
);

-- Enable RLS on carbon_entries
alter table public.carbon_entries enable row level security;

-- Carbon Entries RLS Policies
create policy "Users can view their own carbon entries" on public.carbon_entries
  for select using (auth.uid() = user_id);

create policy "Users can insert their own carbon entries" on public.carbon_entries
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own carbon entries" on public.carbon_entries
  for update using (auth.uid() = user_id);

create policy "Users can delete their own carbon entries" on public.carbon_entries
  for delete using (auth.uid() = user_id);


-- 3. CHALLENGES TABLE
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  points integer not null,
  duration_days integer not null,
  category text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on challenges
alter table public.challenges enable row level security;

-- Challenges RLS Policies
create policy "Allow all users to view challenges" on public.challenges
  for select using (true);

create policy "Only admins can insert challenges" on public.challenges
  for insert with check (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

create policy "Only admins can update challenges" on public.challenges
  for update using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

create policy "Only admins can delete challenges" on public.challenges
  for delete using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );


-- 4. USER CHALLENGES TABLE
create table public.user_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  challenge_id uuid references public.challenges(id) on delete cascade not null,
  status text not null default 'active' check (status in ('active', 'completed', 'failed')),
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  unique (user_id, challenge_id)
);

-- Enable RLS on user_challenges
alter table public.user_challenges enable row level security;

-- User Challenges RLS Policies
create policy "Users can view their own joined challenges" on public.user_challenges
  for select using (auth.uid() = user_id);

create policy "Users can join challenges" on public.user_challenges
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own joined challenges" on public.user_challenges
  for update using (auth.uid() = user_id);


-- 5. ACHIEVEMENTS TABLE
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  badge_url text,
  points_required integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on achievements
alter table public.achievements enable row level security;

-- Achievements RLS Policies
create policy "Allow all users to view achievements" on public.achievements
  for select using (true);

create policy "Only admins can manage achievements" on public.achievements
  for all using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );


-- 6. USER ACHIEVEMENTS TABLE
create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  achievement_id uuid references public.achievements(id) on delete cascade not null,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, achievement_id)
);

-- Enable RLS on user_achievements
alter table public.user_achievements enable row level security;

-- User Achievements RLS Policies
create policy "Users can view their own achievements" on public.user_achievements
  for select using (auth.uid() = user_id);

create policy "Users can insert their achievements" on public.user_achievements
  for insert with check (auth.uid() = user_id);


-- 7. LEADERBOARD TABLE
create table public.leaderboard (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  points integer default 0,
  rank integer,
  period text not null check (period in ('weekly', 'monthly', 'all_time')),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on leaderboard
alter table public.leaderboard enable row level security;

-- Leaderboard RLS Policies
create policy "Allow all users to view leaderboard" on public.leaderboard
  for select using (true);

create policy "Admins or System can manage leaderboard" on public.leaderboard
  for all using (true); -- Allow operations for backend server updates


-- 8. REPORTS TABLE
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  emissions_data jsonb not null,
  suggestions text[],
  pdf_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on reports
alter table public.reports enable row level security;

-- Reports RLS Policies
create policy "Users can view their own reports" on public.reports
  for select using (auth.uid() = user_id);

create policy "Users can insert reports" on public.reports
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own reports" on public.reports
  for delete using (auth.uid() = user_id);


-- 9. AUDIT LOGS TABLE
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  details jsonb,
  ip_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on audit_logs
alter table public.audit_logs enable row level security;

-- Audit Logs RLS Policies
create policy "Only admins can view audit logs" on public.audit_logs
  for select using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

create policy "Allow insertions of audit logs" on public.audit_logs
  for insert with check (true);


-- 10. SEED DATA FOR CHALLENGES & ACHIEVEMENTS
insert into public.challenges (title, description, points, duration_days, category) values
('Use Public Transport 3 Days', 'Leave your car at home and commute by bus, train, or walking for 3 days.', 150, 7, 'transportation'),
('Energy Saver', 'Reduce your electricity consumption by turning off standby appliances and using natural light.', 100, 5, 'energy'),
('Plant Trees', 'Plant a tree or a houseplant and upload a photo to verify!', 200, 10, 'community'),
('Go Vegetarian for a Week', 'Avoid meat products for 7 days to reduce your dietary greenhouse emissions.', 250, 7, 'food'),
('Zero Waste Champion', 'Produce less than 0.5 kg of garbage daily by recycling and composting.', 180, 5, 'waste');

insert into public.achievements (name, description, points_required, badge_url) values
('Eco Beginner', 'Log your first daily carbon footprint entry.', 0, '/badges/beginner.png'),
('Green Warrior', 'Complete 3 eco challenges and earn 300 points.', 300, '/badges/warrior.png'),
('Sustainability Champion', 'Maintain a below-average footprint for 30 consecutive days and reach 1000 points.', 1000, '/badges/champion.png');
