# Coding Conventions Map

**Date Analyzed**: 2026-04-20

## Naming Standards
- **File Names**: 
  - `kebab-case` for React components (`hello-wave.tsx`, `use-theme-color.ts`).
  - `camelCase` for utilities (`appStore.tsx`).
- **Component Names**: `PascalCase` exported from files matching the name.

## Code Style
- **TypeScript**: Strict types mostly used (interfaces in `app/types.tsx`).
- **Imports**: standard ESModules.
- **Styles**: React Native `StyleSheet.create` typically used inline at the bottom of the `.tsx` components, drawing colors from hooks.

## Error Handling
- **State Errors**: Catch blocks within Zustand store methods (`console.log("Error loading persisted data:", error)`). Does not report to external telemetry.

## Common Patterns
- **Theming**: App uses Expo's generic theming logic combined with a set of hooks like `useThemeColor()` inside `components/ThemedText.tsx` and `ThemedView.tsx`.
