# MyPayTracker — Complete Project Documentation

> **Version:** 1.0.0 | **Platform:** iOS + Android (Expo) | **Bundle ID:** `com.bhupinder.mypaytracker`

---

## Table of Contents

1. [What the App Does](#1-what-the-app-does)
2. [Technology Stack](#2-technology-stack)
3. [Project Architecture](#3-project-architecture)
4. [File & Folder Structure](#4-file--folder-structure)
5. [Database Schema](#5-database-schema)
6. [Authentication Flow](#6-authentication-flow)
7. [Tax Engine](#7-tax-engine)
8. [State Management](#8-state-management)
9. [API Layer](#9-api-layer)
10. [Screen-by-Screen Breakdown](#10-screen-by-screen-breakdown)
11. [Security](#11-security)
12. [Testing](#12-testing)
13. [CI/CD Pipeline](#13-cicd-pipeline)
14. [Environment Setup](#14-environment-setup)
15. [Build & Release](#15-build--release)
16. [Development Roadmap](#16-development-roadmap)
17. [Key Decisions Log](#17-key-decisions-log)

---

## 1. What the App Does

**MyPayTracker** is a mobile application built specifically for **New Zealand shift workers**. It solves a real problem: shift workers — in retail, hospitality, construction, healthcare — work irregular hours, often for multiple employers, and struggle to track exactly how much they've earnt and how much tax they owe before payday.

### Core Features

| Feature | Description |
|---|---|
| **Shift Logging** | Log a shift for any day: choose company, pay rate, hours, tax code, holiday pay toggle |
| **Real NZ PAYE** | Progressive 2024/25 tax calculation — correct to IRD spec (not a flat rate guess) |
| **ACC Earner Levy** | 1.53% ACC levy included automatically for primary income codes (M, ME) |
| **Holiday Pay** | Optional 8% gross uplift (Holidays Act 2003 entitlement) |
| **Multi-employer** | Log shifts from multiple companies on the same day |
| **Pay Preview** | Live gross/tax/net breakdown as you type — before you save |
| **Analytics** | Explore tab filters earnings by week / month / year / all time with per-company breakdown |
| **Savings Goal** | Set a savings target and watch a progress bar fill as net earnings accumulate |
| **Cloud Sync** | All data stored in Supabase — access from any device, never lose a shift |
| **Theme Support** | Light / Dark / System theme selectable in Settings |
| **Settings** | Store default tax code, income bracket, IRD number, and employer names |
| **Auth** | Email + password sign-up with email verification and password reset |

---

## 2. Technology Stack

### Core

| Layer | Technology | Version | Why |
|---|---|---|---|
| **Framework** | React Native | 0.81.5 | Cross-platform iOS + Android |
| **Routing** | Expo Router v6 | ~6.0.23 | File-based routing, typed routes |
| **Build tooling** | Expo SDK 54 | ~54.0.29 | Managed workflow, EAS build |
| **Language** | TypeScript | ~5.9.2 | Full type safety, strict mode |
| **New Architecture** | Enabled | — | Fabric + JSI |
| **React Compiler** | Enabled | — | Auto-memoisation |

### Backend / Data

| Layer | Technology | Why |
|---|---|---|
| **Database** | Supabase (PostgreSQL) | Managed Postgres, free tier, RLS built-in |
| **Auth** | Supabase Auth | Email/password, session management, email verification |
| **Session storage** | AsyncStorage | Persists Supabase token locally |
| **Realtime** | (planned) Supabase Realtime | For multi-device live sync |

### State Management

| Library | Purpose |
|---|---|
| **Zustand v5** | Global app state — split into typed slices |
| **TanStack Query v5** | Server state caching, background refetch, retry logic |

### Forms & Validation

| Library | Purpose |
|---|---|
| **react-hook-form v7** | Performant form state, no re-renders per keystroke |
| **zod v4** | Schema-first validation — single source of truth for all form rules |
| **@hookform/resolvers** | Bridge between zod schemas and react-hook-form |

### UI

| Library | Purpose |
|---|---|
| **@expo/vector-icons (Ionicons)** | All icons |
| **react-native-calendars** | Interactive calendar picker on Home screen |
| **react-native-safe-area-context** | Safe-area insets on notched devices |
| **react-native-reanimated** | Animation primitives (used for transitions) |

### Testing

| Library | Purpose |
|---|---|
| **Jest v29** | Test runner |
| **jest-expo** | Expo-aware Jest preset |
| **@types/jest** | TypeScript types for Jest |

### DevOps

| Tool | Purpose |
|---|---|
| **EAS Build** | Standalone APK/IPA compilation |
| **EAS Update** | Over-the-air JS updates without store review |

---

## 3. Project Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Expo Router v6                          │
│   (file-based routing, typed routes, nested groups)             │
│                                                                 │
│   app/_layout.tsx ← QueryClientProvider + SafeAreaProvider +   │
│                      AuthProvider + InitialLayout               │
│         │                                                       │
│         ├── (auth)/                                             │
│         │    ├── login.tsx          (react-hook-form + zod)     │
│         │    ├── register.tsx       (react-hook-form + zod)     │
│         │    └── forgot-password.tsx (react-hook-form + zod)    │
│         │                                                       │
│         └── (tabs)/                                             │
│              ├── _layout.tsx        (tab bar, theme colours)    │
│              ├── index.tsx          (Home — log shifts)         │
│              ├── explore.tsx        (Analytics + savings goal)  │
│              └── settings.tsx       (Profile, theme, data ops)  │
└─────────────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┼──────────────────┐
          ▼                 ▼                  ▼
    Zustand Store      TanStack Query     AuthProvider
    (lib/store/)        (QueryClient)      (context)
          │                 │                  │
          │         ┌───────┘                  │
          ▼         ▼                          ▼
      lib/api/              ←────────   lib/supabase.ts
    ├── shifts.ts                        (client only)
    └── profile.ts
          │
          ▼
    Supabase Backend
    ├── auth.users
    ├── public.profiles  (RLS)
    └── public.shifts    (RLS)
```

### Data Flow

```
User taps "Save shift"
        │
        ▼
react-hook-form validates against shiftSchema (zod)
        │
        ├─ fail → inline field error shown
        │
        └─ pass → useAppStore.addShift(date, entry)
                        │
                        ▼
               lib/api/shifts.ts → createShift()
                        │
                        ▼
               supabase.from("shifts").insert(...)
                        │
                        ├─ error → throw → screen catches → Alert shown
                        │
                        └─ success → get().loadShifts(userId)
                                        │
                                        ▼
                               store.savedDays updated
                                        │
                                        ▼
                               React re-renders Home screen
```

---

## 4. File & Folder Structure

```
MyPayTracker-main/
│
├── app/                          ← Expo Router screens
│   ├── _layout.tsx               ← Root layout (providers)
│   ├── (auth)/
│   │   ├── login.tsx             ← Email/password login
│   │   ├── register.tsx          ← Sign-up + email-sent confirmation
│   │   └── forgot-password.tsx   ← Password reset via email
│   └── (tabs)/
│       ├── _layout.tsx           ← Bottom tab bar config
│       ├── index.tsx             ← Home: pick day + log shifts
│       ├── explore.tsx           ← Analytics + savings progress
│       └── settings.tsx          ← Profile + theme + data ops
│
├── lib/                          ← All non-UI logic
│   ├── supabase.ts               ← Supabase client (env vars only)
│   ├── types.ts                  ← Shared TypeScript types
│   ├── schemas.ts                ← Zod validation schemas (all forms)
│   ├── taxEngine.ts              ← NZ PAYE progressive calculator
│   ├── toast.ts                  ← User-facing error/success helper
│   ├── appStore.ts               ← Thin re-export shim (deprecated)
│   │
│   ├── api/                      ← Data access layer (Supabase queries)
│   │   ├── shifts.ts             ← fetchShifts / createShift / removeShift
│   │   └── profile.ts            ← fetchProfile / updateProfile / mappers
│   │
│   └── store/                    ← Zustand slices
│       ├── index.ts              ← Composed store + loadFromCloud + clearAllData
│       ├── shifts.ts             ← savedDays, addShift, deleteShift, loadShifts
│       └── settings.ts           ← settings, theme, savings, companies
│
├── components/
│   └── AuthProvider.tsx          ← Session context (onAuthStateChange)
│
├── constants/
│   └── DesignSystem.ts           ← Colour tokens for light + dark themes
│
├── assets/
│   └── images/
│       ├── icon.png              ← Custom app icon (1024×1024)
│       └── splash.png            ← Custom splash screen
│
├── __tests__/
│   └── taxEngine.test.ts         ← 26 unit tests for PAYE engine
│
├── .github/
│   └── workflows/
│       └── ci.yml                ← GitHub Actions: typecheck + lint
│
├── app.json                      ← Expo config (bundle IDs, icons, EAS)
├── eas.json                      ← EAS build profiles
├── package.json                  ← Dependencies + Jest config
└── tsconfig.json                 ← Strict TypeScript config
```

---

## 5. Database Schema

Two tables in Supabase (PostgreSQL). Both have Row Level Security (RLS) enabled.

### `public.profiles`

One row per user — created automatically by a database trigger on sign-up.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` PK | FK to `auth.users.id` |
| `user_name` | `text` | Display name (optional) |
| `ird_number` | `text` | IRD number (optional, stored as string) |
| `primary_tax_code` | `text` | Default tax code, e.g. `"M"` |
| `preferred_income_bracket` | `text` | Default income bracket key |
| `theme` | `text` | `"system"`, `"light"`, or `"dark"` |
| `haptics_enabled` | `boolean` | Haptic feedback preference |
| `savings_goal` | `numeric` | Target savings amount (NZD) |
| `savings_current` | `numeric` | Current saved amount (NZD) |
| `company_options` | `text[]` | Saved employer names |
| `updated_at` | `timestamptz` | Last updated |

### `public.shifts`

One row per logged shift.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` PK | Auto-generated |
| `user_id` | `uuid` | FK to `auth.users.id` |
| `date` | `date` | Shift date (`YYYY-MM-DD`) |
| `company_option` | `text` | Company dropdown value (or `"__custom"`) |
| `custom_company` | `text` | Free-text name when `__custom` |
| `pay_rate` | `numeric` | Hourly rate (NZD) |
| `hours_worked` | `numeric` | Hours for this shift |
| `tax_code` | `text` | NZ tax code, e.g. `"M"`, `"S"` |
| `income_bracket_key` | `text` | Income bracket key, e.g. `"15601-53500"` |
| `holiday_pay` | `boolean` | Whether 8% holiday pay was applied |
| `created_at` | `timestamptz` | Row creation time |

### Row Level Security Policies

```sql
-- Users can only read/write their own profile
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Users can only read/write their own shifts
create policy "own shifts" on public.shifts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### Auto-create Profile Trigger

```sql
create function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

---

## 6. Authentication Flow

```
App opens
    │
    ▼
AuthProvider checks getSession()
    │
    ├── No session → redirect to /login
    │
    └── Session exists → loadFromCloud() → redirect to /(tabs)

/login
    │
    ├── User submits (react-hook-form + zod)
    │     └── loginSchema: email valid, password not empty
    │
    └── supabase.auth.signInWithPassword()
          ├── Error → Alert shown via toast.error()
          └── Success → onAuthStateChange fires → InitialLayout redirects

/register
    │
    ├── User submits (react-hook-form + zod)
    │     └── registerSchema: email valid, pw ≥ 8 chars, pw === confirmPw
    │
    └── supabase.auth.signUp()
          ├── Error → Alert shown
          └── Success → email-sent confirmation screen shown

/forgot-password
    │
    └── supabase.auth.resetPasswordForEmail(email)
          └── Success → confirmation screen shown

Sign out
    └── supabase.auth.signOut() → onAuthStateChange → redirect to /login
```

---

## 7. Tax Engine

**File:** `lib/taxEngine.ts`

The tax engine is a pure TypeScript module with no UI dependencies — fully unit-tested.

### NZ PAYE 2024/25 Progressive Brackets (Primary codes: M, ME)

| Annual income | Rate |
|---|---|
| $0 – $15,600 | 10.5% |
| $15,601 – $53,500 | 17.5% |
| $53,501 – $78,100 | 30.0% |
| $78,101 – $180,000 | 33.0% |
| $180,001+ | 39.0% |

### ACC Earner Levy (M / ME codes only)

- **Rate:** 1.53% (2024/25)
- **Maximum liable earnings:** $142,283
- Applied on top of PAYE, pro-rated to the pay period

### Secondary Flat Codes

| Code | Rate |
|---|---|
| SB | 10.5% |
| S / SL | 17.5% |
| SH | 30.0% |
| ST | 33.0% |
| SA | 39.0% |

### How it calculates per shift

```
1. Take gross pay for the period (pay_rate × hours_worked)
2. If holiday pay: gross × 1.08
3. Annualise: gross × periods_per_year (default 52 = weekly)
4. Apply progressive brackets to annual equivalent → annual PAYE
5. Divide back → period PAYE
6. ACC: min(annual_equiv, 142,283) × 0.0153 ÷ periods_per_year
7. Total tax = PAYE + ACC
8. Net = gross - total tax
9. Effective rate = total tax ÷ gross
```

This correctly handles the **progressive nature** of NZ tax — a worker earning $60k doesn't pay 30% on the whole amount. They pay 10.5% on the first $15,600, 17.5% on the next slice, and 30% only on income above $53,500.

---

## 8. State Management

Split into typed Zustand slices, composed at `lib/store/index.ts`.

### Slices

#### `ShiftsSlice` (`lib/store/shifts.ts`)
```ts
savedDays: DayRecord[]         // All shift records grouped by date
isCloudLoading: boolean        // Loading spinner state

loadShifts(userId)             // Fetch & group shifts from Supabase
addShift(date, entry)          // Insert shift → reload
deleteShift(id)                // Delete shift → reload
clearShifts(userId)            // Wipe all shifts for user
```

#### `SettingsSlice` (`lib/store/settings.ts`)
```ts
settings: Settings             // Profile form values
theme: ThemeOption             // "system" | "light" | "dark"
savingsGoal: SavingsGoalState  // { goal: string, current: string }
companyOptions: string[]       // Saved employer names

loadProfile(userId)            // Fetch and map profile row
setSettings(settings)          // Update profile in Supabase
setTheme(theme)                // Change theme + persist
setSavingsGoal(goal)           // Update savings numbers
addCompanyOption(name)         // Append to company_options array
deleteCompanyOption(name)      // Remove from array
resetSettings(userId)          // Wipe profile to defaults
```

#### Combined (`lib/store/index.ts`)
```ts
loadFromCloud()    // Runs loadProfile + loadShifts in parallel
clearAllData()     // Runs clearShifts + resetSettings in parallel
```

### TanStack Query

`QueryClientProvider` wraps the entire app in `_layout.tsx`:

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 2 },
  },
});
```

- **30 second stale time** — data is considered fresh for 30s before background refetch
- **2 retries** — network glitches retried automatically
- Any screen can now use `useQuery` / `useMutation` without prop drilling

---

## 9. API Layer

All Supabase table names and column names are **isolated** in `lib/api/`. No screen or store directly references table structure — only the API functions do.

### `lib/api/shifts.ts`

```ts
fetchShifts(userId)            // SELECT * FROM shifts WHERE user_id = ?
createShift(userId, date, entry)  // INSERT INTO shifts (...)
removeShift(id)                // DELETE FROM shifts WHERE id = ?
removeAllShifts(userId)        // DELETE FROM shifts WHERE user_id = ?
```

### `lib/api/profile.ts`

```ts
fetchProfile(userId)           // SELECT * FROM profiles WHERE id = ?
updateProfile(userId, patch)   // UPDATE profiles SET ... WHERE id = ?
resetProfile(userId)           // UPDATE profiles SET defaults WHERE id = ?
profileToSettings(profile)     // Maps DB row → Settings type
profileToSavings(profile)      // Maps DB row → SavingsGoalState type
```

> **Why this matters:** If you ever rename a column, change to a different backend, or add caching — you change one file, not 6 screens.

---

## 10. Screen-by-Screen Breakdown

### Login (`app/(auth)/login.tsx`)

- react-hook-form + zodResolver (`loginSchema`)
- Inline field errors (red border + message under each field)
- Show/hide password toggle
- Forgot password link → `/forgot-password`
- On success: `_layout.tsx` listens to `onAuthStateChange`, auto-navigates to tabs

### Register (`app/(auth)/register.tsx`)

- react-hook-form + zodResolver (`registerSchema`)
- Validates: email format, pw ≥ 8 chars, pw === confirmPw
- Show/hide password toggle
- On success: switches to email-sent confirmation UI (stays on screen, doesn't navigate)
- User must verify email, then sign in

### Forgot Password (`app/(auth)/forgot-password.tsx`)

- react-hook-form + zodResolver (`forgotPasswordSchema`)
- Calls `supabase.auth.resetPasswordForEmail(email)`
- On success: confirmation screen shown with instructions

### Home (`app/(tabs)/index.tsx`)

- Calendar picks a date (react-native-calendars)
- Company picker (modal SelectField) + custom name input
- Pay rate / hours inputs (decimal keyboard)
- Holiday Pay toggle (+8% gross)
- Tax code picker (from `ALL_TAX_CODES` in taxEngine — single source)
- Income bracket picker for M/ME codes only
- **Live pay preview** — gross / PAYE+ACC / net shown as you type, updates per keystroke via `useMemo`
- Save button → validates → calls `useAppStore.addShift()` → shows result
- Day history section — lists all shifts for selected date with computed totals
- Delete any shift (confirmation alert)
- Cloud loading overlay (spinner + text) when `isCloudLoading === true`

### Explore (`app/(tabs)/explore.tsx`)

- Range filter: **This week / This month / This year / All time**
- Week defined as Monday → Sunday (NZ standard)
- Aggregated stats: total gross, tax, net, hours, average hourly net
- **All calculated from CompanyEntry data using `calculateTax()`** — never trusts zeroed store values
- Per-company breakdown with a simple flex bar chart
- Savings goal progress bar: `current / goal` with percentage label
- Day-by-day shift list for the selected period
- Cloud loading overlay on data fetch

### Settings (`app/(tabs)/settings.tsx`)

- Profile: name, IRD number
- Tax defaults: primary tax code (chip selector)
- Appearance: Light / Dark / System theme chips
- Haptic feedback toggle
- Savings goal inputs (goal NZD, current NZD)
- Actions: Save settings, Clear all data (confirmation alert), Log out (confirmation alert)
- About section with accurate description

---

## 11. Security

| Area | Implementation |
|---|---|
| **Credentials** | Never hardcoded — `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` read from `.env` at build time |
| **.gitignore** | `.env` is git-ignored |
| **Anon key** | The Supabase anon key is safe to ship in mobile apps — it cannot bypass RLS |
| **RLS** | Row Level Security enabled on `profiles` and `shifts`. Users can only read/write their own rows |
| **Service key** | Never used in client code — only used server-side if needed |
| **Password rules** | Minimum 8 characters enforced by zod schema on the client and Supabase Auth on the server |
| **Email verification** | Users must verify their email before their session is fully active |
| **Password reset** | Secure email-link reset via `supabase.auth.resetPasswordForEmail` |
| **Session persistence** | AsyncStorage — scoped to the device, cleared on sign-out |
| **Error messages** | Supabase auth errors passed to `toast.error()` — never swallowed silently |

---

## 12. Testing

**Test runner:** Jest + jest-expo preset  
**Test file:** `__tests__/taxEngine.test.ts`

### Test suites

| Suite | Tests | Covers |
|---|---|---|
| `isPrimaryCode` | 5 | M, ME, S, SH, empty string |
| `ALL_TAX_CODES` | 5 | Contains M, ME, S, SA, no duplicates |
| Edge cases | 5 | Zero gross, negative gross, tax ≤ gross, net = gross−tax, 0 < effectiveRate < 1 |
| Secondary flat codes | 5 | SB 10.5%, S 17.5%, SH 30%, ST 33%, SA 39% |
| M progressive | 6 | Low bracket only, two-bracket, four-bracket, net < gross always, progressive rate increases |
| Holiday pay | 1 | +8% gross produces higher net |

**Total: 26 tests — all passing ✅**

```bash
npm test                    # Run all tests once
npm run test:watch          # Watch mode
npm run typecheck           # tsc --noEmit
```

---

## 13. CI/CD Pipeline

*(Disabled by request. Previously used GitHub Actions for TypeScript/Lint CI tests on push/PR.)*

---

## 14. Environment Setup

### Prerequisites

- Node.js 20+
- Expo CLI (`npm install -g expo-cli`)
- A Supabase account → [supabase.com](https://supabase.com)

### 1. Clone the repo

```bash
git clone https://github.com/Bhupinder22500650/MyPayTracker.git
cd MyPayTracker-main
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the **SQL Editor** and run the full setup SQL:

```sql
-- Profiles table
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  user_name text, ird_number text,
  primary_tax_code text default 'M',
  preferred_income_bracket text,
  theme text default 'system',
  haptics_enabled boolean default false,
  savings_goal numeric default 0,
  savings_current numeric default 0,
  company_options text[] default '{}',
  updated_at timestamptz default timezone('utc', now())
);

-- Shifts table
create table if not exists public.shifts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  company_option text, custom_company text,
  pay_rate numeric not null, hours_worked numeric not null,
  tax_code text not null, income_bracket_key text,
  holiday_pay boolean default false,
  created_at timestamptz default timezone('utc', now())
);

-- RLS
alter table public.profiles enable row level security;
alter table public.shifts enable row level security;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own shifts" on public.shifts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### 3. Create `.env` file

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> Get these from your Supabase project → **Settings → API**

### 4. Run the app

```bash
npx expo start
# Press i for iOS simulator, a for Android, scan QR for Expo Go
```

---

## 15. Build & Release

Built with **Expo Application Services (EAS)** — see `eas.json` for profiles.

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Development build (debug, on-device)
eas build --profile development --platform ios

# Preview build (TestFlight / internal track)
eas build --profile preview --platform all

# Production build (App Store / Play Store)
eas build --profile production --platform all

# Over-the-air update (no store review needed)
eas update --channel production --message "Bug fix"
```

### App identifiers

| Platform | Bundle ID |
|---|---|
| iOS | `com.bhupinder.mypaytracker` |
| Android | `com.bhupinder.mypaytracker` |

---

## 16. Development Roadmap

### ✅ Phase 1 — Foundation (COMPLETE)
- [x] Runtime crash fixes (broken refs)
- [x] Correct progressive NZ PAYE engine with ACC levy
- [x] Day totals computed from CompanyEntry (not zeroed store)
- [x] Supabase RLS + auto-profile trigger SQL
- [x] Email verification confirmation state
- [x] Password reset screen
- [x] Minimum password enforcement
- [x] User-visible errors (toast helper)
- [x] Starter file cleanup

### ✅ Phase 2 — Architecture (COMPLETE)
- [x] API layer (`lib/api/`) — isolates all Supabase knowledge
- [x] Store split into typed slices (`lib/store/`)
- [x] TanStack Query (stale-while-revalidate, retry)
- [x] react-hook-form + zod on all auth forms
- [x] 26 PAYE unit tests — all pass
- [x] ~~GitHub Actions CI pipeline~~ (Removed)
- [x] Design system consolidation

### 🚧 Phase 3 — Product (Next)
- [ ] Shift entry speed: defaults from last shift, templates
- [ ] Onboarding flow (4-question first launch)
- [ ] Pay-cycle view ("This week's pay so far")
- [ ] CSV export for tax time
- [ ] Offline write queue (AsyncStorage → Supabase on reconnect)
- [ ] Biometric lock (Face ID / fingerprint)
- [ ] Skeleton loaders instead of blank screens
- [ ] Currency + date formatting via `Intl`
- [ ] Accessibility labels on all interactive elements

### 📋 Phase 4 — Growth (Future)
- [ ] Sentry crash reporting
- [ ] Analytics (PostHog / Amplitude)
- [ ] Privacy policy + terms of service
- [ ] Delete-account flow (NZ Privacy Act 2020)
- [ ] Landing page
- [ ] Monetisation (freemium / one-time purchase)
- [ ] EAS Update for OTA releases

---

## 17. Key Decisions Log

| Decision | Rationale |
|---|---|
| **Supabase over Firebase** | PostgreSQL with real SQL, RLS baked in, generous free tier, open source |
| **Zustand over Redux** | Far less boilerplate, TypeScript-first, composable slices, no context overhead |
| **TanStack Query alongside Zustand** | Zustand handles app state; TQ handles server state lifecycle (stale/fresh, background refetch) |
| **react-hook-form over Formik** | Significantly fewer re-renders per keystroke; better controlled input management |
| **zod v4 over yup** | TypeScript-first, type inference built-in, faster validation, better error messages |
| **File-based routing (Expo Router)** | Typed routes, deep linking, web compatibility — no manual stack navigation setup |
| **API layer pattern** | Keeps screens and stores backend-agnostic. One file to change if Supabase table names change |
| **Progressive PAYE not flat rate** | The whole value prop of the app is correct numbers. Flat rate overtaxes workers — discovered and fixed in Phase 1 |
| **Totals computed in UI not stored** | Prevents stale/zeroed totals from the DB; recalculated fresh from raw CompanyEntry on every render |
| **Holiday pay persisted per shift** | An earlier version stored it only in local UI state — workers lost the flag on every app reload |
| **Custom icon + splash screen** | First impression matters. A real icon on the home screen differentiates from prototype apps |

---

*Documentation generated on 2026-04-20. Maintained alongside the codebase — if code changes, update this file.*
