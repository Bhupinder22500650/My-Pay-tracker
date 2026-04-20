# MyPayTracker — Project Documentation & Production Readiness Review

> A technical walkthrough of the codebase as it stands today, plus a prioritised list of what to fix, harden, and add before you can call this production-level.

---

## Part 1 — What the project is

MyPayTracker is a React Native mobile app (iOS + Android, via Expo) aimed at New Zealand shift workers. It lets a signed-in user:

1. Pick a day on a calendar.
2. Log one or more shifts for that day — company, pay rate, hours, tax code, optional 8% holiday pay.
3. See a running total of gross pay, PAYE tax, and net pay.
4. View aggregate stats on an Explore tab (week / month / year / all time) with a per-company breakdown and a savings-goal progress bar.
5. Configure defaults and manage data in Settings.

Auth and data storage live in **Supabase** (Postgres + Supabase Auth). Session tokens are persisted locally via **AsyncStorage**.

---

## Part 2 — Architecture at a glance

```
┌─────────────────────────────────────────────────────────────┐
│                      Expo Router (file-based)               │
│                                                             │
│   app/_layout.tsx  ← SafeAreaProvider + AuthProvider        │
│        │                                                    │
│        ├── (auth)/                                          │
│        │     ├── login.tsx                                  │
│        │     └── register.tsx                               │
│        │                                                    │
│        └── (tabs)/                                          │
│              ├── index.tsx      (Home — log shifts)         │
│              ├── explore.tsx    (Analytics + savings goal)  │
│              └── settings.tsx   (Profile, theme, data ops)  │
└─────────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    Zustand store    AuthProvider    lib/supabase.ts
    (appStore.tsx)   (Context)       (Supabase client)
           │               │               │
           └───────────────┴───────────────┘
                           │
                           ▼
                    Supabase backend
                 (Postgres: profiles, shifts)
```

**Routing:** Expo Router v6, file-based. Two route groups: `(auth)` for unauthenticated screens and `(tabs)` for the logged-in tab bar. The top-level `_layout.tsx` redirects between them based on session.

**State:** A single Zustand store (`app/store/appStore.tsx`) holds `savedDays`, `companyOptions`, `savingsGoal`, `settings`, and `theme`. Every mutation writes to Supabase and then calls `loadFromCloud()` to refetch.

**Auth:** `components/AuthProvider.tsx` wraps the app, subscribes to `supabase.auth.onAuthStateChange`, and exposes `{ session, user, isLoading }` via React context.

**Supabase client:** `lib/supabase.ts` creates a client that reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` and persists the session with AsyncStorage.

---

## Part 3 — File-by-file walkthrough

### `app/_layout.tsx`
The root layout. Wraps everything in `SafeAreaProvider` → `AuthProvider` → `InitialLayout`. `InitialLayout` reads the session and redirects: no session + not in `(auth)` → go to login; session + in `(auth)` → go to tabs. On successful login it also calls `useAppStore.getState().loadFromCloud()` to prefetch the user's data.

### `app/(auth)/login.tsx` and `register.tsx`
Straightforward email/password forms that call `supabase.auth.signInWithPassword` and `supabase.auth.signUp`. Loading states, basic empty-field validation, and native `Alert` for errors.

### `app/(tabs)/_layout.tsx`
Configures the bottom tab bar, resolves safe-area insets for the bottom padding, and kicks off an effect that reads the system colour scheme when `theme === "system"`. Uses the design tokens from `constants/DesignSystem.ts`.

### `app/(tabs)/index.tsx` — Home
The main logging screen. Contains:

- The NZ 2025 PAYE primary income brackets and secondary tax code rates as two const arrays.
- A reusable `SelectField` component that opens a modal picker.
- Form state for company, custom company, pay rate, hours, tax code, income bracket, and a holiday-pay toggle.
- A Manage Companies modal that adds/removes saved company names.
- A day-history section that lists every shift saved for the selected date.

### `app/(tabs)/explore.tsx` — Explore
Filters `savedDays` by week / month / year / all-time, then uses `useMemo` to compute totals (gross, tax, net, hours, avg hourly net) and a per-company breakdown. Renders summary cards, a savings-goal progress bar, a simple flex-based bar chart for companies, and a day-by-day list.

### `app/(tabs)/settings.tsx` — Settings
Profile fields (name, IRD number), primary tax code chips, theme chooser, haptics switch, savings-goal inputs, and three destructive-style actions: Save all settings, Clear all data, Log out.

### `app/store/appStore.tsx`
The Zustand store. One slice, ~240 lines. Exposes `loadFromCloud`, `addShift`, `deleteShift`, `addCompanyOption`, `deleteCompanyOption`, `setSavingsGoal`, `setSettings`, `setTheme`, `clearAllData`. Every action hits Supabase directly inside the store.

### `app/types.tsx`
`ThemeOption`, `CompanyEntry`, `DayRecord`, `SavingsGoalState`, `Settings`. Noteworthy: `payRate` and `hoursWorked` are typed as `string`, which is why the screens have to `Number(...)` them everywhere.

### `lib/supabase.ts`
Creates the Supabase client with `AsyncStorage` as the session store, `autoRefreshToken: true`, and `detectSessionInUrl: false` (correct for native).

### `components/AuthProvider.tsx`
Session context. Initial `getSession()` + live `onAuthStateChange` subscription, cleaned up on unmount.

### `constants/DesignSystem.ts` vs `constants/theme.ts`
**You have two competing theme files.** `DesignSystem.ts` is the richer one (primary, secondary, background, surface, border, etc. in both light and dark) and is the one the tab bar actually uses. `theme.ts` is the Expo starter template's tint-based system and is currently only referenced by the unused starter components in `components/`.

### `components/` starter files
`themed-text.tsx`, `themed-view.tsx`, `parallax-scroll-view.tsx`, `hello-wave.tsx`, `external-link.tsx`, `haptic-tab.tsx`, `ui/collapsible.tsx`, `ui/icon-symbol.*` — all appear to be leftovers from `npx create-expo-app`. They aren't imported anywhere in the three tab screens or the auth screens.

### Config files
- `app.json` — Expo config. `newArchEnabled: true`, `reactCompiler: true`, `typedRoutes: true`, bundle IDs set, EAS project ID present.
- `eas.json` — Standard dev / preview / production build profiles.
- `tsconfig.json` — Strict mode on, `@/*` path alias configured.
- `eslint.config.js` — Default Expo ESLint config.

---

## Part 4 — Supabase data model (inferred from the code)

Looking at the store, there are two tables:

**`profiles`** (one row per user, keyed by `id = auth.users.id`)

| Column | Type |
|---|---|
| `id` | uuid (FK to `auth.users.id`) |
| `company_options` | text[] |
| `savings_goal` | numeric |
| `savings_current` | numeric |
| `user_name` | text |
| `ird_number` | text |
| `primary_tax_code` | text |
| `preferred_income_bracket` | text |
| `theme` | text |
| `haptics_enabled` | boolean |

**`shifts`** (one row per logged shift)

| Column | Type |
|---|---|
| `id` | uuid (PK) |
| `user_id` | uuid (FK to `auth.users.id`) |
| `date` | date |
| `company_option` | text |
| `custom_company` | text |
| `pay_rate` | numeric |
| `hours_worked` | numeric |
| `tax_code` | text |
| `income_bracket_key` | text |

You didn't include SQL migrations, so I can't verify RLS policies or indexes — see Part 6.

---

## Part 5 — Bugs I found reading the code

These are concrete issues in the files as they exist right now. The first three stood out because they will either break the app or silently produce wrong numbers.

### 🔴 Critical

**1. `app/(tabs)/index.tsx` references `addShift` and `existingDay` but never defines them.**
Lines 162 and 298–334 use variables that don't exist in scope. `addShift` is a method on the store — it needs to be destructured from `useAppStore()` on line 119. `existingDay` needs to be derived from `savedDays` for the selected date. As written, this file will crash at runtime the moment someone hits Save or loads a day with saved entries. This looks like a refactor that wasn't finished.

**2. PAYE tax calculation is wrong.**
Both Home and the store compute tax as `gross × (bracket_rate / 100)`. NZ PAYE is **progressive** — the first $15,600 is taxed at 10.5%, the next slice up to $53,500 at 17.5%, and so on. A worker earning $60,000/year doesn't pay 30% on the whole lot; they pay 10.5% on the first slice, 17.5% on the next, and 30% only on the portion above $53,500. The current code materially overtaxes most users. On top of that, PAYE is applied per *pay period* (weekly/fortnightly) with the annual brackets pro-rated, not per *shift*. A shift calculator needs either an annualising assumption or a weekly bracket table.

**3. `totalGross` / `totalTax` / `totalNet` are never computed.**
`loadFromCloud` explicitly sets them to 0 (lines 84–86 of the store) with a comment saying the UI will compute them. Explore then reads them back as `day.totalGross`, `day.totalTax`, `day.totalNet` — which are always 0. Your summary cards on Explore are displaying zeros for every user who hasn't added a shift in the current session.

### 🟠 High

**4. Holiday Pay toggle on Home is not persisted.**
`holidayPayEnabled` is local UI state. It affects the preview in the day-history section but isn't included in the `addShift` payload — the shift saved to Supabase has no holiday-pay flag, so the Explore tab can never know about it.

**5. Deleting a company name doesn't update shifts that reference it.**
`deleteCompanyOption` just removes the string from the array. Any saved shifts still point to that company name via `company_option`, which is fine, but the UI assumes the name is in the dropdown list. Minor, but worth deciding on behaviour.

**6. Tax code list in Settings ≠ tax code list in Home.**
Home has `["M", "ME", "S", "SH", "ST", "SA", "SB"]`. Settings has `["M", "S", "SH", "ST", "SB", "SL", "ME", "SB SL"]`. They're inconsistent — `SA` is missing from Settings, `SL` and `SB SL` are in Settings but not Home. Pick one source of truth.

**7. No row-level security guarantees in the client code.**
The store queries `supabase.from("shifts").select("*").eq("user_id", user.id)`. That only works safely if you have RLS policies set up in Supabase. If you don't, a malicious client could drop the `.eq(...)` and read everyone's data. You should verify RLS is enabled on both tables.

**8. `loadFromCloud` refetches on every mutation.**
Every `addShift` / `deleteShift` is followed by a full `loadFromCloud()`. For a user with hundreds of shifts that's an unnecessary round-trip. Zustand lets you update local state directly from the insert response.

### 🟡 Medium

**9. `handleChangeTheme` in Settings doesn't go through `setSettings`.**
It calls `setTheme(value)` only. The `settings.theme` field ends up out of sync with the real `theme` slice. Since two places compute themes from these two different values, the app can render an inconsistent state.

**10. "System" theme doesn't track live changes.**
`(tabs)/_layout.tsx` reads `Appearance.getColorScheme()` once in a `useEffect` with `[]`, then *writes the result back* as either `"light"` or `"dark"`, overwriting the user's `"system"` preference. If the user toggles their OS appearance at night, nothing happens — and their "system" setting has already been silently converted to a fixed mode.

**11. Empty `catch` logging.**
Every error handler in the store is `console.log("Error ...", error)`. Users never see a failure — saving a shift can silently fail. No retry, no toast, no surfacing.

**12. `console.log` in production bundles.**
These will ship with release builds. Use a logger with level gating.

**13. The login/register screens don't honour the user's theme.**
They hard-code `#F2F2F7` backgrounds. Dark-mode users see a flash of white.

**14. Typed numeric inputs stored as strings.**
`payRate` and `hoursWorked` are typed as `string` throughout. You validate with `isNaN(+payRate)` in one place and `Number(entry.payRate)` in another. This is a constant source of bugs — convert at the boundary (parse on form submit, store as number).

**15. No input validation on IRD number, pay rate bounds, hours bounds.**
A user can save `-50` hours at `$99999/hr`. Savings goal accepts negative numbers. No sanity checks anywhere.

### 🔵 Low / polish

**16. Unused starter files.** `components/hello-wave.tsx`, `components/parallax-scroll-view.tsx`, `components/themed-text.tsx`, `components/themed-view.tsx`, `components/ui/collapsible.tsx`, `components/ui/icon-symbol.*`, `components/external-link.tsx`, `components/haptic-tab.tsx`, `hooks/use-color-scheme*.ts`, `hooks/use-theme-color.ts`, `constants/theme.ts`, `scripts/reset-project.js` — none of these are referenced by your actual app. Delete them.

**17. `className="fullCard"` on a `View` in Explore (line 211).** That's Tailwind/NativeWind syntax. You aren't using NativeWind. It's a no-op.

**18. `useEffect(() => { ... loadAll(); ... }, [])` in `(tabs)/_layout.tsx` calls `loadAll` but the store doesn't export `loadAll` — only `loadFromCloud`. This is another broken reference that will crash on tab mount.**

**19. README claims "no external servers" and "AsyncStorage" as the database engine.** The actual app uses Supabase as the primary store. The README is out of date.

**20. Hard-coded colours everywhere.** `#6B4EFF`, `#10B981`, `#EF4444`, `#F8F9FA` are scattered across every screen's StyleSheet instead of being pulled from `DesignSystem.ts`. This is why there's no real dark-mode support — the colours can't react to the theme.

---

## Part 6 — What's needed to reach production

I'll group this by how much each item affects users vs. how much work it is.

### Must-fix before any public release

**Correctness of the tax engine.** You advertise "Smart Tax Engine" and "New Zealand's 2025 PAYE Tax Brackets" on the store page. If the numbers are wrong, that's a refund risk and a reputation risk. Do this properly:
- Build a `calculatePAYE(grossPeriod, periodsPerYear, taxCode)` function in a separate module.
- For M/ME codes, annualise the period income, apply the progressive brackets, then divide back.
- For secondary codes, apply the flat rate correctly — noting that SB, S, SH, ST, SA thresholds depend on *total* annual income from all sources, which the app would need to ask about.
- Handle ACC earner levy (1.46% for 2024–25, check current rate) which PAYE also deducts and isn't in your brackets array.
- Add unit tests for at least a dozen known cases from the IRD PAYE calculator.

**Fix the broken references in Home and the tab layout** (`addShift`, `existingDay`, `loadAll`). The app is currently shipping with runtime crashes on the happiest paths. Nothing else matters until this is done.

**Compute and persist daily totals.** Either compute them on write and store as columns on `shifts` / derived in a view, or — simpler — compute them in a `useMemo` wherever `savedDays` is consumed, and stop trusting `day.totalGross` from the store.

**Turn on and verify Row Level Security.** In Supabase, for both `profiles` and `shifts`:
```sql
alter table public.profiles enable row level security;
alter table public.shifts enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own shifts" on public.shifts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```
Also set up a trigger so a `profiles` row is created automatically when a user signs up:
```sql
create function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

**Email verification.** Right now `signUp` + immediate use; require email confirmation in Supabase Auth settings, and handle the "check your email" state in the register screen.

**Password rules.** Minimum length, strength indicator, and a password-reset flow (`supabase.auth.resetPasswordForEmail`). None of these exist.

**Surface errors to the user.** Replace every `console.log("Error ...", error)` with a user-facing message — a toast or a banner. Silent failures destroy trust.

**Delete all the starter cruft.** Unused components, unused constants/theme.ts, the `reset-project` script. It adds surface area for bugs and makes onboarding new contributors harder.

### Should-fix for a quality release

**One source of truth for tax codes, brackets, and design tokens.** Move the three hard-coded lists into `constants/tax.ts` and `constants/DesignSystem.ts` and import them everywhere. Delete the duplicate `theme.ts`.

**Proper loading/empty/error states.** Every screen currently has two states (loading and loaded). You need at least loading / empty / error / loaded, consistently.

**Offline support.** A shift-logging app is used on the job, often with bad signal. Queue writes locally when offline (AsyncStorage or MMKV), replay on reconnect. At minimum, cache the last fetched `savedDays` so the app doesn't show blank on a cold start without a network.

**Analytics + crash reporting.** Sentry or Expo's error reporting for crashes, PostHog or Amplitude for funnels (registration → first shift → 7-day retention). You need this data to improve the product.

**Accessibility.** No `accessibilityLabel`, no `accessibilityRole`, no dynamic type support, touch targets sometimes under 44×44. For App Store review on iOS this alone can get you bounced.

**Internationalisation & formatting.** `toFixed(2)` for currency is naive — use `Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' })`. Dates should use `Intl.DateTimeFormat`, not raw `"YYYY-MM-DD"` strings.

**Proper form library.** `react-hook-form` + `zod` for validation will clean up every screen and make error messaging free.

**Tests.** You have zero. At minimum:
- Unit tests for `calculatePAYE`.
- Component tests for the Home form (React Native Testing Library).
- A couple of Detox or Maestro end-to-end flows (sign up → add shift → see total → log out).

**CI/CD.** A GitHub Actions workflow that runs `tsc --noEmit`, ESLint, and your tests on every PR. Expo EAS has a GitHub integration for preview builds per PR.

**Respect "system" theme properly.** Subscribe to `Appearance.addChangeListener` so the app updates when the OS toggles, and stop overwriting `"system"` with `"light"`/`"dark"` in settings.

### Nice-to-have

- Biometric unlock (`expo-local-authentication`) so the app can be locked even while signed in.
- Export to CSV for tax-time.
- Shift templates ("standard weekday", "Sunday penalty rate") to speed up entry.
- Push notifications for a weekly payslip summary (`expo-notifications`).
- A simple onboarding flow on first launch to capture the user's default tax code and annual income estimate — once you have that, a lot of the "pick your bracket every time" friction goes away.
- In-app updates via `expo-updates` so you can ship bug fixes without a store review.
- Delete-account flow. GDPR / NZ Privacy Act 2020 expects this.
- Privacy policy and terms-of-service links in Settings (both Apple and Google require these).

---

## Part 7 — Security checklist

- [ ] RLS policies on `profiles` and `shifts`.
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` is the anon key (safe to ship), not the service-role key — **double-check this**, service-role keys have bypass-RLS powers and you must never put one in the client.
- [ ] Email verification required before first login.
- [ ] Password reset flow.
- [ ] Rate-limit login attempts (Supabase Auth has this but needs to be configured).
- [ ] Sessions refresh correctly after long backgrounding — test this manually.
- [ ] Delete-account path that actually deletes data server-side, not just the client cache.
- [ ] `.env` is in `.gitignore` (it is — good) and no secrets in commit history.
- [ ] App Transport Security / certificate pinning if you go further.

---

## Part 8 — A concrete next-steps checklist

In order, smallest-effort-highest-impact first:

1. Fix the three broken references (`addShift`, `existingDay`, `loadAll`). Run the app. Verify you can save and see a shift.
2. Compute day totals from `CompanyEntry` everywhere they're used. Drop the zeroed columns from the store.
3. Write the real PAYE function, with tests. Swap it into Home and the aggregations in Explore.
4. Turn on RLS and add the auth-trigger. Rerun the app end-to-end.
5. Persist Holiday Pay. Unify the tax code lists.
6. Replace silent `console.log` errors with user-visible toasts.
7. Delete the starter-template files and consolidate the design system.
8. Wire up Sentry.
9. Add email verification + password reset.
10. Add accessibility labels and currency/date formatting.
11. Add offline write queue.
12. Add a minimal test suite and a CI pipeline.

Get through 1–6 and you'll have a solid v1. 7–12 is what makes it feel production-grade.

---

*End of review. If you want, the next thing I can do is write the corrected `calculatePAYE` module with tests, or draft the RLS migrations — pick whichever unblocks you.*