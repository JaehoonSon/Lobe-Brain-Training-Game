# Lobe - Brain Training Game 🧠

Lobe is a React Native/Expo mobile app that helps users improve their cognitive abilities through scientifically-backed brain training games. The app delivers personalized 30-day training plans targeting memory, focus, processing speed, logic, and language skills.

<p align="center">
  <img src="./assets/images/brain_logo.png" alt="Lobe Logo" width="150"/>
</p>

## 📱 App Information

- **Version:** 1.0.4
- **Platform:** iOS & Android (primarily built for iOS)
- **Bundle ID (iOS):** com.theblucks.brainapp
- **Package (Android):** com.knuceles.ExpoTemplate
- **App Store:** [Download on iOS](https://apps.apple.com/us/app/lobe-brain-training-games/id6757370720)

## 🎮 Brain Training Games

Lobe includes 9 cognitive training games designed to challenge different areas of your brain:

| Game                               | Description                                   | Category         |
| ---------------------------------- | --------------------------------------------- | ---------------- |
| **Mental Arithmetic**              | Test numerical processing speed & accuracy    | Speed/Logic      |
| **Memory Matrix**                  | Spatial memory & recall with grid patterns    | Memory           |
| **Mental Language Discrimination** | Language processing & vocabulary skills       | Language         |
| **Wordle**                         | Word guessing game (max 6 attempts)           | Language         |
| **Ball Sort**                      | Puzzle game sorting colored balls into tubes  | Logic            |
| **Word Unscramble**                | Unscramble letters to form words (with hints) | Language         |
| **Math Rocket**                    | Speed-based math with physics mechanics       | Speed            |
| **Stroop Clash**                   | Color/word interference cognitive test        | Focus            |
| **Odd One Out**                    | Find the unique item among distractors        | Focus/Perception |

## ✨ Features

### Core Features

- 🎯 **Personalized Training Plans** - 30-day customized workout plans based on user goals
- 📊 **Statistics & Insights** - Track performance metrics, daily streaks, and cognitive improvements
- 🤖 **Daily AI Insights** - Personalized daily feedback and motivation
- 🏆 **Gamification** - Points, streak tracking, and achievements
- ⚙️ **Profile Management** - Birthday, goals, preferences, difficulty levels
- 💎 **Premium Membership** - Pro subscription via RevenueCat

### Technical Features

- 🌍 **Multi-language Support** - 10 languages including English, Spanish, Japanese, Chinese, Portuguese, German, French, Hindi, Russian, and Korean
- 🔔 **Push Notifications** - Daily training reminders
- 📈 **Analytics** - PostHog & Tenjin integration for user behavior tracking
- 🌓 **Dark/Light Mode** - System theme detection with manual override
- 📱 **Native Features** - Haptic feedback, camera access, media library integration
- 🔐 **Secure Authentication** - Apple Sign-In and Google Sign-In

## 🛠️ Technology Stack

### Framework & Core

- **React Native** 0.81.5
- **Expo** ~54.0.30
- **TypeScript** 5.9.2
- **Expo Router** ~6.0.21 (file-based routing)

### UI & Styling

- **NativeWind** v4 (Tailwind CSS for React Native)
- **React Native Reusables** (UI primitives)
- **Lucide React Native** (icons)
- **React Native Skia** (advanced graphics)
- **Lottie** (animations)
- **Victory Native** (charts/graphs)

### Backend & Database

- **Supabase** (PostgreSQL backend)
  - Real-time subscriptions
  - Row-level security
  - Edge functions for analytics
  - Auto-generated TypeScript types

### Authentication

- **Apple Sign-In** (expo-apple-authentication)
- **Google Sign-In** (@react-native-google-signin/google-signin)
- **Supabase Auth** with session persistence

### Monetization & Analytics

- **RevenueCat** - Subscription & IAP management
- **PostHog** - Event tracking & user analytics
- **Tenjin** - Attribution tracking

### State Management

- React Context API (Auth, Games, Notifications, Onboarding, Theme, Stats)
- AsyncStorage for persistence

## 🌍 Internationalization

Lobe supports 10 languages:

- 🇬🇧 English (en)
- 🇪🇸 Spanish (es)
- 🇯🇵 Japanese (ja)
- 🇨🇳 Chinese Simplified (zh-Hans)
- 🇵🇹 Portuguese (pt)
- 🇩🇪 German (de)
- 🇫🇷 French (fr)
- 🇮🇳 Hindi (hi)
- 🇷🇺 Russian (ru)
- 🇰🇷 Korean (ko)

Implementation via `i18next` and `react-i18next` with locale files in `assets/locales/`.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator

### Installation

```bash
# Clone the repository
git clone https://github.com/JaehoonSon/Lobe-Brain-Training-Game.git

# Navigate to project directory
cd Lobe-Brain-Training-Game

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Environment Setup

Create a `.env` file in the root directory with the following configuration:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
EXPO_PUBLIC_SUPABASE_SECRET_KEY=your_supabase_secret_key
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Payment
EXPO_PUBLIC_REVENUECAT_API_KEY=your_revenuecat_api_key

# Auth
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_web_client_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_google_ios_client_id
AUTH_APPLE_SECRET=your_apple_secret
AUTH_GOOGLE_SECRET=your_google_secret

# PostHog
EXPO_PUBLIC_POSTHOG_KEY=your_posthog_key
EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# MMP
EXPO_PUBLIC_TENJIN_API_KEY=your_tenjin_api_key
```

**Required Variables:**

- **Supabase**: Backend database credentials (URL, publishable key, secret key)
- **RevenueCat**: Subscription management API key
- **Google Auth**: Client IDs for web and iOS authentication
- **Apple Auth**: Secret key for Apple Sign-In

**Optional Variables:**

- **PostHog**: Analytics platform (key and host)
- **Tenjin**: Mobile measurement partner for attribution tracking
- **Google Auth Secret**: Additional Google authentication configuration

## 📜 Available Scripts

### Development

```bash
npm run dev              # Start Expo dev server (clear cache)
npm run dev:web          # Start web development
npm run dev:android      # Start Android development
npm run android          # Start Android development
npm run ios              # Start iOS development
npm run web              # Start web development
```

### Database (Supabase)

```bash
npm run db:link          # Link Supabase project
npm run db:new           # Create new migration
npm run db:push          # Push migrations to database
npm run db:push:merge    # Push all migrations including merged
npm run db:types         # Generate TypeScript types from database
```

### Maintenance

```bash
npm run clean            # Remove .expo and node_modules
npm run lint             # Run ESLint checks
```

## 📁 Project Structure

```
./
├── app/                     # Expo Router screens & route groups
│   ├── (authenticated)/     # Protected routes (auth required)
│   │   ├── (tabs)/         # Bottom tab navigation
│   │   ├── game/           # Game screens
│   │   ├── insight/        # Insights screens
│   │   └── stat/           # Statistics screens
│   ├── (unauthenticated)/  # Public routes (sign in)
│   └── (onboarding)/       # First-time user flow
├── components/
│   ├── ui/                 # shadcn/ui primitives (CVA-based)
│   ├── Authenticated/      # Auth-specific components
│   └── games/              # Game components (9 games)
├── contexts/               # React Context providers
│   ├── AuthProvider.tsx
│   ├── GamesContext.tsx
│   ├── GameSessionContext.tsx
│   ├── NotificationProvider.tsx
│   ├── OnboardingContext.tsx
│   ├── PostHogProvider.tsx
│   ├── RevenueCatProvider.tsx
│   ├── ThemeContext.tsx
│   └── UserStatsContext.tsx
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities, Supabase client, icons
│   └── database.types.ts   # Auto-generated Supabase types
├── supabase/               # Database migrations & config
│   └── migrations/         # SQL migration files
├── assets/                 # Images, fonts, animations
│   ├── images/            # App icons and images
│   └── locales/           # Translation files
└── languages/              # Language configuration files
```

## 🗄️ Database Schema

Key Supabase tables:

- `profiles` - User profiles and preferences
- `games` - Game metadata and results
- `categories` - Game categories (Memory, Focus, Logic, Speed, Language)
- `content_translations` - Multi-language content
- `daily_insights` - AI-generated daily insights
- `push_notifications` - Push notification records

## 🔐 Authentication Flow

1. User opens app → Splash screen
2. Check for existing Supabase session
3. If no session → Sign in screen (Apple/Google Sign-In)
4. First-time users → Onboarding flow (goals, preferences, notifications)
5. Authenticated users → Main app (tabs navigation)

## 🎨 Styling Conventions

- **Path alias:** `~/` = project root (configured in tsconfig.json)
- **Styling:** NativeWind v3 with `native:*` and `web:*` prefixes
- **CVA pattern:** Export component, variants, and types separately
- **Fonts:** Nunito font family with various weights
- **Theming:** CSS variables in `global.css` for light/dark modes

## 🔧 When Adding Native Features

```bash
# Clean prebuild
npx expo prebuild --clean

# Run on specific platform
npx expo run:ios      # iOS
npx expo run:android  # Android
```

## 📝 Development Guidelines

### Conventions

- **Components:** PascalCase file names, named exports
- **Hooks:** camelCase with `use` prefix
- **Imports:** Group React → third-party → internal aliases
- **Auth flow:** Apple/Google Auth → Supabase ID token → session management

### Anti-patterns (Avoid)

- ❌ Don't use `as any` or `@ts-ignore` (strict mode)
- ❌ Never commit `.env` files
- ❌ Don't modify `lib/database.types.ts` directly (regenerate with `db:types`)
- ❌ Don't use absolute paths without `~/` alias
- ✅ Always throw errors after Supabase operations: `if (error) throw error;`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev)
- UI components from [React Native Reusables](https://rnr-docs.vercel.app/)
- Backend powered by [Supabase](https://supabase.com)
- Icons from [Lucide](https://lucide.dev)
