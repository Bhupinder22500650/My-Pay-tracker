# Architecture Map

**Date Analyzed**: 2026-04-20

## System Design
- **Architecture Pattern**: Component-based UI with centralized state management using Zustand and persistent storage.
- **Routing**: File-based routing via `expo-router`.
- **State Strategy**: A single global store `useAppStore` created with Zustand in `app/store/appStore.tsx`. State is tied to local storage (`AsyncStorage`) via sync methods inside the store.

## Flow & Entry Points
- **Main Entry**: Managed implicitly by `expo-router/entry` setting in `package.json`.
- **Global Layout**: `app/_layout.tsx` is the root layout wrapping navigation.
- **Tabs Layout**: `app/(tabs)/_layout.tsx` manages nested tab bar navigation.

## Component Boundaries
- **UI Components**: Generic reusable UI components in `components/ui/` (e.g., `icon-symbol.tsx`, `collapsible.tsx`) and general layout items in `components/` (e.g., `parallax-scroll-view.tsx`).
- **Hooks**: Custom hooks in `hooks/` are used mostly for theming (`use-color-scheme.ts`, `use-theme-color.ts`).
- **Business Logic Context**: Embedded primarily inside Zustand store (`app/store/appStore.tsx`), which handles loading, appending records, deleting options, and syncing async storage.

## Data Abstractions
- **Types Extraction**: Typings are aggregated in `app/types.tsx` (e.g., DayRecord, SavingsGoalState, ThemeOption).
