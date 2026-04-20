# Areas of Concern Map

**Date Analyzed**: 2026-04-20

## Technical Debt
- **Error Handling**: Currently, the `AsyncStorage` fails gracefully with a simple `console.log()` without user-facing feedback and fallback.
- **Testing**: Zero automated testing configured currently.
- **Store Scale**: The `useAppStore` in `app/store/appStore.tsx` loads the ENTIRE dataset at once (`loadAll: () => Promise<void>`). While minimal risk for a single-user app with small savings data, a very large `STORAGE_KEY_DAYS` history might become sluggish to parse entirely on app start over time.

## Architectural Bottlenecks
- Single `Zustand` store for the entire application (combines DayRecords, Companies, Savings Goal, Settings, Theme). May warrant splitting to individual slices if the app grows, though fine for its current scope.

## Missing Features / Fragility
- Default company configurations (`Allied Security`, `Pak'nSave`) are hardcoded into the initial fallback array in the store. Should likely reside in a constants setup or seeded once dynamically.
