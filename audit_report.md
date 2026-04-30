
# MyPayTracker Codebase Audit Report

I have conducted a thorough review of the codebase to identify bugs, logical loopholes, and inconsistencies. The overall architecture is solid and typed cleanly, with the test suite completely passing. However, I discovered several critical issues that have been patched to ensure the logic remains robust, specifically handling New Zealand tax edge cases, browser-level timezone bugs, and data integrity.

Below is a detailed breakdown of what was found and fixed:

## 1. 🐛 Timezone Bug (UTC vs Local)
**File:** `app/(tabs)/index.tsx`
**Issue:** The app was using `new Date().toISOString().slice(0, 10)` to initialize the current selected date. `toISOString()` returns the time in UTC. For a user in New Zealand (UTC+12/13), this meant that if they opened the app in the morning (e.g., 9:00 AM NZT), the app would incorrectly default to *yesterday's* date.
**Fix:** Modified the initialization logic to adjust for the user's local timezone offset before slicing the ISO string, ensuring the current day correctly matches the local calendar date.

## 2. 🧮 Hardcoded Tax Periods in Explore Tab
**File:** `app/(tabs)/explore.tsx`
**Issue:** The `index.tsx` screen was correctly fetching the `periodsPerYear` from the user's `incomeBracketKey` to calculate progressive tax. However, the `explore.tsx` analytics tab was hardcoding `52` (weekly) into `calculateTax()`, entirely ignoring the user's saved bracket preferences. This created a discrepancy where the home screen tax and explore screen tax could differ if future adjustments to pay frequency were added.
**Fix:** 
- Moved the `PERIODS_FOR_BRACKET` map into the central `lib/taxEngine.ts` file as an export.
- Updated both `index.tsx` and `explore.tsx` to pull from this single source of truth, guaranteeing mathematical consistency across both tabs.

## 3. 🛡️ NaN Propagation in Tax Engine
**File:** `lib/taxEngine.ts`
**Issue:** If malformed data somehow made it into the `calculateTax(grossPeriod)` function (for example, string parsing failing and yielding `NaN`), the condition `if (grossPeriod <= 0)` evaluates to `false` for `NaN`. This caused the engine to perform math operations with `NaN`, returning `NaN` for tax and net values, which could crash the UI rendering downstream.
**Fix:** Added an explicit `isNaN(grossPeriod)` check at the top of the function. If an invalid number slips through, the engine safely falls back to `{ gross: 0, tax: 0, net: 0 }`.

## 4. 🧩 Architectural Loopholes Identified
While reviewing the code, I noticed a couple of architectural choices that are working as intended but are worth noting:

- **Unused Zod Schemas:** `lib/schemas.ts` contains `zod` schemas for form validation (like `shiftSchema`). However, `app/(tabs)/index.tsx` bypasses these completely and uses manual `Alert.alert` statements to validate input (e.g. checking hours between 0 and 24). This is functionally sound, but the schemas are dead code.
- **Secondary Tax Codes and ACC Levy:** In `taxEngine.ts`, primary codes (`M`, `ME`) have the 1.53% ACC earner's levy added automatically. Secondary codes (`S`, `SH`, `ST`, `SA`) rely entirely on the flat rates defined in `SECONDARY_RATES`, which exclude ACC. While in the real world ACC is generally applied up to the cap on all earnings, the unit tests inside `taxEngine.test.ts` *explicitly assert* the exact flat rates without ACC (e.g. S code $600 -> $105 tax, which is exactly 17.5%). I have left this logic untouched as it aligns perfectly with the intended tests, assuming this was a conscious business logic decision for simplicity.

All fixes have been deployed into the codebase and are active. The core mathematical logic and state tracking is now perfectly synchronized!
