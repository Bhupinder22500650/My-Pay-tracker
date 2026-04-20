# MyPayTracker

**MyPayTracker** is a mobile application built specifically for New Zealand shift workers. It allows users to track their shifts, log hours across multiple employers, and accurately calculate their gross pay, correct NZ PAYE tax, and net income before payday.

## Core Features

- **Shift Logging:** Log shifts across multiple employers with specific pay rates.
- **Accurate NZ PAYE:** Progressive 2024/25 tax calculation matching IRD specifications.
- **ACC & Holiday Pay:** Automatically calculates ACC Earner Levy and optional 8% holiday pay.
- **Pay Preview:** Live calculation of gross pay, tax, and net pay as you type.
- **Analytics & Tracking:** Earnings broken down by week, month, and year, along with a savings goal tracker.
- **Cloud Sync:** Securely syncs all data to the cloud.
- **Authentication:** Secure email/password login.
- **Dark/Light Mode Options**

## Technology Stack

- **Frontend:** React Native, Expo Router (v6)
- **Language:** TypeScript
- **State Management:** Zustand, TanStack Query
- **Forms & Validation:** react-hook-form, Zod
- **Backend / Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Styling:** Vector Icons, native-safe-area-context, Reanimated

## Environment Setup

### Prerequisites

- Node.js 20+
- Expo CLI
- A Supabase account

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Bhupinder22500650/My-Pay-tracker.git
   cd MyPayTracker-main
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Supabase:**
   Create a Supabase project and use the required SQL to structure the `profiles` and `shifts` tables along with appropriate Row Level Security (RLS) policies.

4. **Environment Variables:**
   Create a `.env` file in the root of your folder and add your Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

5. **Run the App:**
   ```bash
   npx expo start
   ```
   Press `i` to open in iOS simulator, `a` for Android, or scan the QR code using the Expo Go app.

## Build and Release

The app is built using **Expo Application Services (EAS)**. You can build it for iOS or Android directly through EAS CLI tools.

## Licensing

*All rights reserved.*
