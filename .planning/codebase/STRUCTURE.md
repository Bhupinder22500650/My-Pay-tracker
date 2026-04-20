# Structure Map

**Date Analyzed**: 2026-04-20

## Directory Layout
- `/app` - Expo Router file-based pages and API routes
  - `/(tabs)` - Tab-based navigation (Explore, Index/Home, Settings)
  - `/store` - Global state management store (Zustand context and AsyncStorage persistence)
  - `_layout.tsx` - App global shell/layout wrapper
  - `types.tsx` - Typescript interfaces
- `/components` - Reusable UI components
  - `/ui` - Basic design system elements
- `/constants` - Hardcoded data and visual specs (`theme.ts`)
- `/hooks` - Custom React hooks (`use-color-scheme.ts`, etc.)
- `/assets` - Static assets, images, splines, etc.
- `/scripts` - Utilities for build steps (e.g., `reset-project.js`)

## Key Locations
- `app/store/appStore.tsx`: Main data persistence and app state logic wrapper.
- `package.json`: Main project configuration with Expo setup.
