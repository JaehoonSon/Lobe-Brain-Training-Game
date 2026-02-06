# PROJECT KNOWLEDGE BASE

**Generated:** 2025-01-09
**Commit:** 2dbce9c
**Branch:** main

## OVERVIEW

Expo/React Native brain training app with Supabase backend, Expo Router navigation, NativeWind styling.

## STRUCTURE

```
./
├── app/                     # Expo Router screens & route groups
│   ├── (authenticated)/     # Protected routes (auth required)
│   ├── (unauthenticated)/   # Public routes (auth not required)
│   └── (onboarding)/        # First-time user flow
├── components/
│   ├── ui/                  # shadcn/ui primitives (CVA-based)
│   ├── Authenticated/       # Authenticated-specific components
│   └── games/               # Game-related components
├── contexts/                # React Context providers
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities, Supabase client, icons
├── supabase/                # Database migrations & config
└── assets/                  # Images, fonts, animations
```

## WHERE TO LOOK

| Task            | Location                           | Notes                                      |
| --------------- | ---------------------------------- | ------------------------------------------ |
| Add screen      | `app/`                             | Route groups enforce auth state            |
| UI component    | `components/ui/`                   | Use CVA for variants                       |
| Business logic  | `hooks/`, `contexts/`              | Hooks for state, contexts for global state |
| Supabase query  | `lib/`, `hooks/`                   | Types from `lib/database.types.ts`         |
| Database schema | `supabase/migrations/`             | Run `db:push` after changes                |
| Styling config  | `tailwind.config.js`, `global.css` | CSS variables for theming                  |

## CONVENTIONS

- **Path alias**: `~/` = project root (configured in tsconfig.json)
- **Components**: PascalCase file names, named exports `export { Component }`
- **Hooks**: camelCase with `use` prefix (`useAuth`, `useGameSession`)
- **Styling**: NativeWind v3 with `native:*` and `web:*` prefixes
- **CVA pattern**: Export component, variants, and types separately
- **Imports**: Group React → third-party → internal aliases
- **Auth flow**: Apple Auth → Supabase ID token → session management
- **Navigation**: Expo Router with route groups, Stack.Protected for auth guards

## ANTI-PATTERNS (THIS PROJECT)

- **NEVER** use `as any` or `@ts-ignore` (strict mode)
- **NEVER** commit `.env` files (secrets)
- **NEVER** modify `lib/database.types.ts` directly (regenerate with `db:types`)
- **NEVER** use absolute paths without `~/` alias
- **ALWAYS** throw errors after Supabase operations: `if (error) throw error;`

## UNIQUE STYLES

- Button press effects via `border-b-4` → `border-b-0` + `translate-y-1` for tactile feel
- Font utilities map to Nunito weights (font-normal → Nunito_400Regular, etc.)
- Android navigation bar auto-matches theme (useAndroidNavigationBar hook)
- Text nesting via `TextClassContext.Provider` in components with child text

## COMMANDS

```bash
# Development
npm run dev              # Expo dev server (clear cache)
npm run dev:web          # Web dev
npm run dev:android      # Android dev

# Database
npm run db:link          # Link Supabase project
npm run db:new           # New migration
npm run db:push          # Push migrations
npm run db:types         # Regenerate types

# Maintenance
npm run clean            # Remove .expo, node_modules
npm run lint             # ESLint checks
```

## NOTES

- Route groups: `(authenticated)` requires auth, `(unauthenticated)` for public, `(onboarding)` for first-time users
- Debug logging is present in auth flow (console.log for state transitions)
- No test runner configured—validate by running app in Expo
- Supabase auth uses AsyncStorage for session persistence on mobile
- Apple Sign In implemented; Google Sign In placeholder exists
