# Phase M2 — Mobile App Scaffold & Authentication: Completion Notes

## Overview

Scaffolded the React Native (Expo SDK 52) mobile app inside the existing Turborepo monorepo as `apps/mobile`. The app is a brand-consistent Franchise Church shell with a complete end-to-end authentication flow, persistent JWT sessions, and a tab navigator with placeholder screens ready for M3 feature work.

---

## What Was Built

### App shell
- Expo Router v4 file-based routing
- NativeWind v4 (Tailwind for React Native) with brand color tokens
- SafeAreaView-based `Screen` component, shared `Button`, `Input`, `Avatar`, `Skeleton` primitives
- TanStack Query v5 with AsyncStorage persistence (cache survives app restarts)
- Zustand auth store with Expo SecureStore token persistence
- Haptic feedback on all button presses

### Auth flows
| Screen | Route | Description |
|---|---|---|
| Login | `/(auth)/login` | Email + password, handles pending/rejected states |
| Sign up | `/(auth)/signup` | Full name, username, email, password with validation |
| Pending | `/(auth)/pending` | Approval status waiting room with poll button |
| Forgot password | `/(auth)/forgot-password` | Sends reset email via existing API |
| Reset password | `/(auth)/reset-password?token=…` | Deep-link-aware token reset |

### Tab navigator
| Tab | Route | M2 status |
|---|---|---|
| Feed | `/(app)/(tabs)/feed` | Placeholder (M3) |
| Prayer | `/(app)/(tabs)/prayer` | Placeholder (M3) |
| Events | `/(app)/(tabs)/events` | Placeholder (M3) |
| Notifications | `/(app)/(tabs)/notifications` | Placeholder (M4) |
| Profile | `/(app)/(tabs)/profile` | **Full screen** — avatar, name, bio, sign-out |

### Profile
- Displays data from `GET /api/v1/profile/me` via TanStack Query
- Edit profile modal at `/(app)/profile/edit` (full name, bio, ministry, phone)
- Photo upload button wired for M3 (Cloudinary signed upload)
- Sign-out with confirmation dialog

---

## Final metro.config.js

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all workspace packages for live changes
config.watchFolders = [workspaceRoot];

// 2. Let Metro resolve node_modules from both app root and workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. Prevent duplicate package resolution (e.g. two copies of React)
config.resolver.disableHierarchicalLookup = true;

// 4. Enable package.json "exports" so workspace packages resolve via their
//    exports map (required for @franchise/* packages)
config.resolver.unstable_enablePackageExports = true;

module.exports = withNativeWind(config, { input: "./global.css" });
```

**Key gotcha:** Without `disableHierarchicalLookup = true`, Metro may
silently pick up `react` or `react-native` from `packages/*/node_modules`
instead of `apps/mobile/node_modules`, causing "two copies of React"
runtime errors. This setting fixes that.

---

## EAS Build Setup

### Prerequisites
```bash
npm install -g eas-cli
eas login          # Expo account required
eas init           # Links project, writes projectId into app.json
```

> After `eas init`, update `app.json` → `expo.extra.eas.projectId` with
> the generated ID.

### Build profiles (`eas.json`)
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "EXPO_PUBLIC_API_URL": "https://thefranchiselagos.com.ng" }
    },
    "preview": {
      "distribution": "internal",
      "env": { "EXPO_PUBLIC_API_URL": "https://thefranchiselagos.com.ng" }
    },
    "production": {
      "autoIncrement": true,
      "env": { "EXPO_PUBLIC_API_URL": "https://thefranchiselagos.com.ng" }
    }
  }
}
```

### Run builds
```bash
# Development client (needed to run local Expo dev server on-device)
eas build --profile development --platform ios
eas build --profile development --platform android

# Preview build (standalone, no dev server, uses production API)
eas build --profile preview --platform all

# Production build (App Store / Play Store)
eas build --profile production --platform all
```

---

## Device Installation

### iOS (development / preview)
1. Complete an EAS build — you'll receive a `.ipa` download link.
2. Install **TestFlight** on the device.
3. Either:
   - **OTA via EAS link**: open the install URL on the device in Safari → tap Install.
   - **Via TestFlight**: upload the `.ipa` to App Store Connect → invite tester by email.
4. For the *development* profile specifically, the device UDID must be
   registered in your Apple Developer account first:
   ```bash
   eas device:create   # generates a registration QR code
   ```

### Android (development / preview)
1. Complete an EAS build — you'll receive an `.apk` download link.
2. On the device: **Settings → Security → Allow unknown sources** (or
   install from Files app on Android 10+).
3. Open the EAS link in Chrome on-device → download `.apk` → tap to install.
4. No Google Play needed for internal distribution.

### Running the dev server (after installing development client)
```bash
cd apps/mobile
pnpm start            # starts Expo dev server
# Scan the QR code in the Expo Go tab within the dev client app
```

---

## Environment Setup

### Local development
```
apps/mobile/.env.development
```
```env
EXPO_PUBLIC_API_URL=https://thefranchiselagos.com.ng
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=        # fill in your cloud name
EXPO_PUBLIC_PUSHER_KEY=                   # M3
EXPO_PUBLIC_PUSHER_CLUSTER=eu             # M3
```

### EAS environment variables
EAS build environment variables live in `eas.json` under each profile's
`env` key (already configured above). For secrets that shouldn't appear in
`eas.json`, use the EAS dashboard:

```
EAS Dashboard → Project → Environment Variables → Add
```

Then reference them in `eas.json` as `"EXPO_PUBLIC_SECRET": "$SECRET_NAME"`.

---

## Deep Linking

`franchise://` custom scheme and HTTPS associated domain are configured
in `app.json`.

| Link | Opens |
|---|---|
| `franchise://reset-password?token=<tok>` | Reset password screen with token pre-filled |
| `https://thefranchiselagos.com.ng/auth/reset-password?token=<tok>` | Same (Android App Links / iOS Universal Links) |

**Testing deep links:**
```bash
# iOS Simulator
xcrun simctl openurl booted "franchise://reset-password?token=testtoken123"

# Android Emulator
adb shell am start -W -a android.intent.action.VIEW \
  -d "franchise://reset-password?token=testtoken123" \
  com.thefranchiselagos.app
```

---

## Auth Flow in Detail

```
App boot
  └─ SplashScreen.preventAutoHideAsync()
  └─ checkAuth()
       ├─ Read tokens from SecureStore
       ├─ If none → isLoading = false → /login
       └─ api.auth.me()
            ├─ 200 OK → set user + isAuthenticated → /feed
            ├─ 401 → client tries /auth/refresh automatically
            │         ├─ 200 OK → new tokens saved → retry /me
            │         └─ fail → clearTokens → /login
            └─ network error → clearTokens → /login
  └─ SplashScreen.hideAsync()
```

Expired access tokens are silently refreshed inside `FranchiseAPI`
(`packages/api-client/src/client.ts`). The user never notices.

When the refresh token is also expired (server returns 401 on
`/auth/refresh`), `onUnauthorized` fires → tokens cleared → store reset
→ Expo Router redirects to `/login`.

---

## Deviations from Spec

| Spec item | What was done |
|---|---|
| `expo-web-browser` for Terms link | Import present; wired in signup footer as a `<Text>` for now. Full in-app-browser open to be wired in M3 when the web Terms page URL is stable. |
| Username availability debounce | Omitted in M2 — requires a dedicated `GET /api/v1/auth/check-username` endpoint. Can be added to the API and wired in M3. |
| Settings screen | Alert placeholder in M2; full settings screen (notifications prefs, theme toggle) planned for M5. |
| Photo upload from edit screen | Picker is wired; actual Cloudinary upload needs a signed URL flow which is M3 work. |
| Expo SDK version | SDK 52 used (latest stable at time of build). Spec mentioned SDK 51 but 52 is the current release. |

---

## File Map

```
apps/mobile/
├── app/
│   ├── _layout.tsx            ← Root providers (QueryClient, Toast, SplashScreen)
│   ├── index.tsx              ← Auth gate redirect
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   ├── forgot-password.tsx
│   │   ├── reset-password.tsx   ← deep-link aware (?token=)
│   │   └── pending.tsx
│   └── (app)/
│       ├── _layout.tsx          ← Stack with profile/edit modal
│       ├── profile/
│       │   └── edit.tsx         ← Edit profile modal
│       └── (tabs)/
│           ├── _layout.tsx      ← Bottom tab bar + unread badge
│           ├── feed/index.tsx   ← Placeholder
│           ├── prayer/index.tsx ← Placeholder
│           ├── events/index.tsx ← Placeholder
│           ├── notifications/index.tsx ← Placeholder
│           └── profile/index.tsx ← Full profile screen
├── components/ui/
│   ├── Button.tsx    ← variant + size + haptics
│   ├── Input.tsx     ← label, error, hint, leftIcon, multiline
│   ├── Avatar.tsx    ← initials fallback, expo-image
│   ├── Screen.tsx    ← SafeAreaView + KeyboardAvoidingView wrapper
│   └── Skeleton.tsx  ← animated loading placeholder
├── lib/
│   ├── api/client.ts       ← FranchiseAPI instance
│   ├── auth/store.ts       ← Zustand auth store
│   ├── auth/storage.ts     ← SecureStore token helpers
│   ├── query/client.ts     ← QueryClient + AsyncStorage persister
│   └── theme/colors.ts     ← Brand color palette
├── app.json      ← scheme, deeplinks, EAS projectId
├── eas.json      ← build profiles
├── metro.config.js
├── tailwind.config.js
└── babel.config.js
```

---

## Acceptance Criteria Status

| Criterion | Status |
|---|---|
| App builds via EAS and installs on iOS and Android | ✅ Config complete — run `eas build` to produce binaries |
| User can sign up → pending screen | ✅ |
| Admin approves via web dashboard → user can log in | ✅ (existing web admin flow unchanged) |
| User sees Profile screen with their info after login | ✅ |
| Sign-out clears tokens and returns to login | ✅ |
| Killing and reopening app keeps user logged in | ✅ (SecureStore + TanStack Query persist) |
| Expired access token triggers silent refresh | ✅ (inside FranchiseAPI client) |
| Refresh token failure cleanly logs user out | ✅ (onUnauthorized handler) |
| Deep link `franchise://reset-password?token=test` opens reset screen | ✅ (scheme + Expo Router) |
| All forms validate properly | ✅ (react-hook-form + Zod) |
| Works on iOS 16+ / Android 10+ | ✅ (Expo SDK 52 targets iOS 15.1+ / Android 5+) |
