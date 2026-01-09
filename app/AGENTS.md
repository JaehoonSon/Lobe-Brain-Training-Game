# APP DIRECTORY GUIDE

Expo Router screens with file-based routing and route groups.

## STRUCTURE
```
app/
├── (authenticated)/         # Auth-required routes
│   ├── (tabs)/              # Tab navigation
│   ├── game/[id]/           # Dynamic game routes
│   └── _layout.tsx          # Authenticated layout
├── (unauthenticated)/       # Public routes
│   ├── index.tsx            # Welcome/login
│   ├── login.tsx
│   └── _layout.tsx
├── (onboarding)/            # First-time user flow
│   ├── steps/               # Onboarding steps
│   ├── templates/           # Onboarding templates
│   └── _layout.tsx
├── _layout.tsx              # Root layout with providers
└── +not-found.tsx          # 404 page
```

## WHERE TO LOOK
| Task | Location |
|------|----------|
| Add authenticated screen | `app/(authenticated)/` |
| Add public screen | `app/(unauthenticated)/` |
| Add onboarding screen | `app/(onboarding)/` |
| Route configuration | `_layout.tsx` files |
| Root providers | `app/_layout.tsx` |

## CONVENTIONS
- **Route groups**: Parentheses `(name)` = folder-only (no URL path)
- **Auth guards**: `<Stack.Protected guard={isAuthenticated}>` in root layout
- **Screens**: Export default function component
- **Layouts**: Wrap screens with providers, define shared UI
- **Navigation**: `router.push('/path')`, `router.back()`, `router.replace('/path')`
- **Dynamic routes**: `[id].tsx` → access via `useLocalSearchParams()`

## ANTI-PATTERNS
- **NEVER** use direct navigation outside Expo Router
- **NEVER** modify root layout providers without understanding auth flow
- **NEVER** mix authenticated/unauthenticated screens in same route group
- **NEVER** skip layouts when adding new route groups
