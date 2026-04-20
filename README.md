# 🚀 MyPayTracker

**MyPayTracker** is a premium, powerful, and privacy-focused mobile application designed specifically for shift workers (especially in New Zealand). It calculates hours, tax, and take-home pay, logs a day-by-day history, and helps users stay on top of long-term savings goals.

Built with **React Native** + **Expo Router**, backed by robust local storage and secured by **Supabase Authentication**.

## 🌟 Key Features

- **🔐 Secure Authentication**: Fast and reliable account management powered by Supabase.
- **💰 Shift Logging**: Easily log daily shifts. Add hourly pay rates, hours worked, and automatically toggle 8% Holiday Pay.
- **🇳🇿 Smart Tax Engine**: Automatically calculates net pay based on New Zealand's 2025 Paye Tax Brackets and Secondary Tax codes (M, ME, S, SH, ST, SA, SB).
- **📊 Real-time Insights (Explore)**: Check your total gross, net, taxes, and average net hourly rates. View clean visual breakdowns of your earnings partitioned by the companies you work for.
- **🎯 Savings Goals**: Program your target savings in 'Settings' and visually track your pipeline from the Explore tab.
- **⚙️ Custom Defaults**: Seamless configurations for default primary tax codes and the option to enforce haptic feedback. Fully functional 'Clear Data' utilities for a fresh start.
- **📱 Premium Design**: Features deep, glassmorphic layout principles, curated vibrant aesthetics, dynamic device safe-area handling, and smooth interactive keyboard behaviors.

## 🛠️ Technology Stack
- **Framework**: React Native + Expo
- **Navigation**: Expo Router (Modern File-based routing)
- **State Management**: Zustand
- **Authentication**: Supabase
- **Local Database Engine**: AsyncStorage
- **Components**: `react-native-safe-area-context`, `react-native-calendars`, `expo-vector-icons`

## 🧰 Local Development & Setup

Make sure you have Node installed, alongside the Expo CLI.

1. Clone this repository:
```bash
git clone https://github.com/Bhupinder22500650/MyPayTracker.git
cd MyPayTracker
```

2. Install the necessary dependencies:
```bash
npm install
```

3. Configure your Environment Variables:
Inside the root folder, assign your Supabase Keys to the `.env` file for remote user authentication:
```env
EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

4. Launch the application:
```bash
npx expo start
```
*Use the Expo Go app on your physical device, or simply press `i` or `a` to boot up the iOS Simulator/Android Emulator respectively!*

## 🎨 Theme Support

MyPayTracker is fully configured to respect user-preference via an internal design token system. You can force switch between Dark and Light mode from the Settings UI, or allow it to track your internal System theme directly!
