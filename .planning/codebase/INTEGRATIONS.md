# Integrations Map

**Date Analyzed**: 2026-04-20

## Internal Integrations
- **Local Storage**: Data persistence (saved days, company options, savings goal, settings, theme) heavily uses `@react-native-async-storage/async-storage`.

## External APIs
- Currently, no external HTTP REST or GraphQL APIs are configured in the `package.json` (e.g., Axios, fetch) outside of potential Expo default system integrations. The app operates standalone with AsyncStorage.

## Authentication Providers
- None currently implemented or detected in the standard dependencies.

## Platform Integrations
- **Expo Camera / Media**: None explicitly listed in package.json aside from standard Expo image (`expo-image`)
- **Native Modules**: Includes `expo-haptics`, `expo-linking`, `expo-splash-screen`, `expo-system-ui`, and `expo-web-browser`.
