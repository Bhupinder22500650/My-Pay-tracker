# Tech Stack Map

**Date Analyzed**: 2026-04-20

## Core Application
- **Runtime Environment**: React Native via Expo (~54.0.29)
- **Language**: TypeScript (~5.9.2)
- **Framework**: React Native (0.81.5) / React (19.1.0)
- **Routing**: `expo-router` (~6.0.23)

## Data Layer
- **State Management**: Zustand (`zustand` ^5.0.9) - configured at `app/store/appStore.tsx`
- **Storage Strategy**: Local storage persistence via `@react-native-async-storage/async-storage` (2.2.0)

## UI & Design System
- **Styling Method**: React Native StyleSheet, custom ThemedText/ThemedView components
- **Component Libraries**: 
  - `expo-symbols`
  - `@expo/vector-icons`
- **Animations/Gestures**: 
  - `react-native-reanimated` (~4.1.1)
  - `react-native-gesture-handler` (~2.28.0)
  - `react-native-worklets`

## Tooling & Infrastructure
- **Build System**: Expo CLI (eas and standard expo builds)
- **Linting & Formatting**: ESLint (`eslint` ^9.25.0) with `eslint-config-expo`
- **Type Checking**: TypeScript

## Key Dependencies
- `react-native-calendars`
- `lodash`
