# MyPayTracker — Improvement Roadmap

> A phased plan to grow MyPayTracker from its current state into a real product. Based on the goal of building a real product, improving across correctness, UI/UX, features, and architecture, on an ongoing timeline.

The order matters more than the list itself. Doing UI polish before fixing the tax engine is wasted work; adding features before fixing architecture compounds debt. Each phase's work makes the next phase easier — skipping ahead just means redoing things.

---

## The mental model: four phases

| Phase | Focus | Rough effort (evenings) |
|-------|-------|------------------------|
| 1. Foundation | Fix what's broken | 3–4 weeks |
| 2. Architecture | Stop the bleeding | 6–8 weeks |
| 3. Product | Make it worth paying for | 2–3 months |
| 4. Growth | Get users and keep them | Ongoing |

Total to a publicly shippable product: **~6 months** of evening work.

Don't move to the next phase until the current one is solid.

---

## Phase 1 — Foundation

**Goal: the app works correctly for every user on every path.** Nothing else matters if this isn't true.

### 1.1 Fix the runtime crashes (day one)

Three references are broken and the app crashes on the happy path:

- `app/(tabs)/index.tsx` — `addShift` is not destructured from the store; `existingDay` is never derived.
- `app/(tabs)/_layout.tsx` — `loadAll()` is called but doesn't exist on the store.

Do this in one sitting. The app literally doesn't run without it.

### 1.2 Build a correct tax engine

This is the single biggest thing that separates "a student project" from "a product a shift worker will pay for." Your store listing promises an NZ 2025 PAYE engine — shipping wrong numbers is a refund and reputation risk.

Build it as a pure, tested module:

```
lib/tax/
├── brackets.ts         // NZ 2025 PAYE brackets, secondary codes, ACC earner levy
├── calculatePAYE.ts    // Pure function: (annualGross, taxCode) => { paye, acc, net }
├── calculatePAYE.test.ts
└── index.ts
```

Key rules the current code gets wrong:

- **PAYE is progressive**, not flat. Someone earning $60k doesn't pay 30% on the whole amount — they pay 10.5% on the first $15,600, 17.5% on the next slice, and 30% only on the portion above $53,500.
- **PAYE applies per pay period**, not per shift. You have to annualise, apply brackets, then divide back.
- **ACC earner levy** (currently 1.46%) also comes out of gross and isn't in your brackets array.
- **Secondary codes (S, SH, ST, SA, SB) depend on total annual income** from all sources — the app needs to ask.

Write the tests *first*. Pick 15–20 known cases from the IRD PAYE calculator and make them pass. Once this module is correct and tested, the rest of the app just calls it.

**If you get only one thing production-grade in Phase 1, make it this.**

### 1.3 Compute day totals properly

`loadFromCloud` hard-codes `totalGross: 0, totalTax: 0, totalNet: 0`, and Explore reads them back straight. Every new app launch shows zeroes. Compute these in a `useMemo` wherever `savedDays` is consumed and stop trusting them from the store.

### 1.4 Lock down Supabase

Turn on Row Level Security on both tables:

```sql
alter table public.profiles enable row level security;
alter table public.shifts   enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own shifts" on public.shifts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Add a trigger so a `profiles` row is created automatically when a user signs up:

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

### 1.5 Fix the auth flow

- Enable email verification in Supabase Auth settings.
- Handle the "check your email" state on the register screen.
- Add password-reset via `supabase.auth.resetPasswordForEmail`.
- Enforce a minimum password length.

### 1.6 Make errors visible

Every silent `console.log("Error ...", error)` becomes a toast. Pull in `sonner-native` or `react-native-toast-message` and wrap Supabase calls in a helper that surfaces failures. Users who hit a save error need to know.

### Done when

A stranger can sign up, verify email, log a shift, see correct numbers, close the app, reopen it, and see their data. No crashes, no wrong math, no silent failures.

---

## Phase 2 — Architecture

**Goal: the codebase can absorb new features without getting worse.** You'll be adding features for years. The current structure won't survive that.

### 2.1 Split the store

One Zustand store doing auth state, data fetching, cloud sync, and UI preferences is fine at 240 lines. At 800 lines it becomes the worst file in the codebase.

```
app/store/
├── shifts.ts       // savedDays, addShift, deleteShift
├── companies.ts    // companyOptions
├── settings.ts     // settings, theme, savings goal
└── index.ts        // re-exports
```

### 2.2 Move data access out of the store

Right now your store knows about Supabase table names and column names. That's a layering violation. Create a data layer:

```
lib/api/
├── shifts.ts       // fetchShifts(), createShift(), deleteShift()
├── profile.ts      // fetchProfile(), updateProfile()
└── supabase.ts     // client
```

Stores call the API layer. The API layer knows about Supabase. Nothing else does. If you ever switch backends, or add caching, or add optimistic updates — you change one file.

### 2.3 Adopt TanStack Query

This is the biggest quality-of-life win in the whole plan. You get caching, refetch-on-focus, optimistic updates, loading/error states, and background refresh for free. The "refetch the entire cloud on every mutation" pattern in your store goes away.

Pair it with the API layer above and your screens become almost trivial.

### 2.4 Consolidate the design system

- Delete `constants/theme.ts` (duplicate of `DesignSystem.ts`).
- Delete every unused starter component (`components/hello-wave.tsx`, `themed-text.tsx`, `themed-view.tsx`, `parallax-scroll-view.tsx`, `external-link.tsx`, `haptic-tab.tsx`, `ui/collapsible.tsx`, `ui/icon-symbol.*`, `hooks/use-color-scheme*.ts`, `hooks/use-theme-color.ts`, `scripts/reset-project.js`).
- Every hard-coded colour in a `StyleSheet.create` becomes `theme.colors.primary`.
- Build a `useTheme()` hook that returns the right token set based on current scheme.

Once this is done, dark mode works everywhere automatically, and you'll never hard-code another hex colour.

### 2.5 Proper forms

Every form in the app is `useState` soup with manual validation. Pull in `react-hook-form` + `zod`. Define a schema per form. Get validation, typed values, and error messages for free.

### 2.6 Testing foundation

You don't need 100% coverage — you need the critical paths covered so you can refactor fearlessly. Minimum:

- Unit tests on `lib/tax/` (already done in Phase 1)
- Component tests on the shift-entry form (React Native Testing Library)
- One end-to-end happy path with Maestro (sign up → add shift → see it on Explore)

### 2.7 CI pipeline

GitHub Actions workflow that runs on every push:

- `tsc --noEmit`
- `expo lint`
- `jest` (or whatever test runner you pick)

Now you can't accidentally break main.

### Done when

You can add a new feature by touching 2–3 files, and you trust CI to catch mistakes.

---

## Phase 3 — Product

**Goal: the app is something a shift worker would actually choose over a spreadsheet.** Now you can build.

> ⚠️ Before any of this: sit down with three real shift workers (not developers) and watch them use your app for ten minutes each. You'll learn more in half an hour than from any amount of code review. Every feature idea below is educated guessing until you've done this.

### 3.1 Speed of shift entry (the whole game)

The current flow is eight interactions: pick date → pick company from modal → pick custom or not → type pay rate → type hours → pick tax code from modal → (maybe) pick bracket from modal → hit save.

Cut it to three:

- Default to today, last company used, last pay rate, last tax code.
- "Same as yesterday" as a one-tap option.
- Shift templates ("Standard weekday", "Weekend", "Public holiday").
- Swipe through days on the calendar.

### 3.2 Onboarding

First launch should ask four questions and never ask them again:

1. Your default tax code.
2. Your usual employer(s).
3. Your pay cycle (weekly / fortnightly).
4. Your annual savings goal.

Every subsequent shift entry is now almost automatic.

### 3.3 Pay-cycle awareness

Your app calculates per-shift tax, but workers think in pay cycles. Add a view that shows:

> "This week's pay so far: $X gross, $Y net. Cycle ends Thursday."

Paystub-style summary with a progress bar to the cycle end. **This is the feature that converts the app from calculator to dashboard.**

### 3.4 Export & reporting

Come tax time, users want a CSV. Year-end summary screen with share-to-email. This alone is worth the price of entry for self-employed contractors.

### 3.5 Offline support

A construction worker at a site with no reception needs to log the day's shift. Queue writes in AsyncStorage, replay on reconnect. TanStack Query makes this tractable.

### 3.6 Biometric lock

`expo-local-authentication`. Face ID / fingerprint to open the app even while signed in. For an app that shows someone's income, this is expected.

### 3.7 Polish pass (in this order)

1. Haptics on every button press (you have the setting — wire it up).
2. Skeleton loaders on every list instead of blank screens.
3. Empty states with illustrations and a clear next action.
4. Smooth animations on modal opens, tab switches, list inserts (Reanimated is already in your deps).
5. Proper currency/date formatting via `Intl.NumberFormat` and `Intl.DateTimeFormat`.
6. Accessibility labels on every interactive element.

### 3.8 What NOT to build (yet)

Resist the urge to add:

- Goal tracking beyond savings
- Investment tracking
- Budget categories
- Multi-currency support
- Social features

Every feature you add is one you have to support forever. Ship the core loop exceptionally well first.

### Done when

You'd genuinely use this over a spreadsheet, and so would your three test users.

---

## Phase 4 — Growth

**Goal: the app can find and keep users.** Product's good, now the business work.

### 4.1 Instrumentation

- **Sentry** for crashes. Without this you're flying blind.
- **PostHog or Amplitude** for product analytics. Know your funnel: registration → first shift → 7-day retention.

### 4.2 Legal & store requirements

- Privacy policy (both Apple and Google require it).
- Terms of service.
- Delete-account flow (NZ Privacy Act 2020 / GDPR).
- App Store Connect listing: screenshots, description, keywords.
- Play Console listing: screenshots, description, content rating.

### 4.3 Discoverability

- A landing page. Even a single-page Vercel site with screenshots and download buttons dramatically improves credibility.
- Soft-launch to r/newzealand or a local Facebook group for tradies. **Ten users giving real feedback beats 1,000 downloads of silence.**

### 4.4 Monetisation (only after you have users)

Free tier + one-time purchase or $2.99/month for advanced features (exports, templates, investment integration). Don't build subscription infrastructure before you have users who want to pay.

### 4.5 Operational

- **EAS Update** for over-the-air bug fixes without store reviews.
- A simple roadmap published somewhere public (GitHub Projects, a Notion page). Users who feel heard stick around.
- A CHANGELOG in the repo.

### Done when

You have 100 real users, you know which features they use, and you have a direction for v2.

---

## Meta-advice

Three things that matter more than any individual item above.

### Ship small, ship often

Don't batch up three months of work into a release. EAS Update lets you push bug fixes instantly. A weekly or biweekly release cadence, even to yourself, builds the discipline you need.

### Write things down

Start a `docs/` folder in the repo. Decision records for architecture choices ("why we chose Zustand over Redux"). A CHANGELOG. A ROADMAP. Future you will thank present you.

### Dogfood relentlessly

Use the app for your own shifts, every day, from now on. Every annoyance you feel is a bug a real user would churn over. **If you don't want to use it, nobody will.**

---

## The immediate next step

Pick one of these three concrete first tasks:

1. **Write the `calculatePAYE` module with tests** — highest-impact single piece of work in Phase 1.
2. **Draft the Supabase RLS + auth-trigger migration** — closes your biggest security hole.
3. **Sketch the store split** — makes every subsequent change easier.

Start there. Don't try to do everything at once — the point of the four phases is that you're allowed to ignore everything outside the current one.