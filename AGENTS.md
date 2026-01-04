# AGENTS.md - Brain App Development Guide

This document provides guidelines for agentic coding agents working on this codebase.

## Project Overview

Brain App is an Expo/React Native application using:
- **Framework**: Expo SDK 54 with Expo Router for navigation
- **Styling**: NativeWind (Tailwind CSS v3) with custom theming system
- **UI Components**: shadcn/ui-style components using class-variance-authority
- **Backend**: Supabase for authentication and database
- **Language**: TypeScript with strict mode
- **Path Alias**: `~/*` maps to project root (configured in tsconfig.json)

## Build Commands

```bash
# Development
npm run dev              # Start Expo dev server with clean cache
npm run dev:web          # Web development server
npm run dev:android      # Android development server

# Platform builds
npm run android          # Build/run Android app
npm run ios              # Build/run iOS app
npm run web              # Build/run web app

# Maintenance
npm run clean            # Clean .expo and node_modules
npm install              # Reinstall dependencies (runs postinstall for Tailwind)
```

## Code Style Guidelines

### Imports and Organization

- Use path aliases (`~/lib/*`, `~/components/*`, `~/hooks/*`) for imports
- Group imports by type: React imports, third-party, internal aliases
- Named exports for components: `export { ComponentName }`
- Type exports separately: `export type { ComponentProps }`

```typescript
// Correct
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { Pressable } from "react-native";
import { cn } from "~/lib/utils";

// Incorrect
import React, { useState } from 'react';
import { cn } from "../lib/utils";
```

### Component Patterns

- Use `class-variance-authority` (CVA) for component variants
- Define variants constant with `cva()` and export both component and variants
- Destructure props with `ref` first, then `className`, then others
- Use `TextClassContext.Provider` for nested text styling in components

```typescript
const buttonVariants = cva("base classes...", {
  variants: {
    variant: { default: "...", destructive: "..." },
    size: { default: "...", sm: "...", lg: "..." },
  },
  defaultVariants: { variant: "default", size: "default" },
});

function Button({ ref, className, variant, size, ...props }: ButtonProps) {
  return <Pressable className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
}
```

### Styling with NativeWind

- Use Tailwind utility classes as base
- Add `native:*` prefix for React Native-specific styles
- Use `web:*` prefix for web-specific styles
- Use `native:h-12` or `native:px-5` syntax for platform variants
- CSS variables defined in `global.css` follow `hsl(var(--variable))` pattern

```tsx
<View className="h-10 px-4 native:h-12 native:px-5 web:hover:bg-accent" />
```

### Theming

- Three themes available: `theme-default`, `theme-ocean`, `theme-rose`
- Dark mode via `dark:` class prefix on root elements
- Theme colors defined as CSS custom properties in `global.css`
- Use semantic color names: `primary`, `secondary`, `accent`, `destructive`, `muted`

### TypeScript

- Strict mode enabled - no implicit `any`
- Define explicit types for all props and context
- Use interface for object types when appropriate
- Leverage Database types from `~/database.types` for Supabase

### Error Handling

- Use try/catch with async/await for async operations
- Throw errors after Supabase operations: `if (error) throw error;`
- Console.log debug statements allowed in development code
- Context providers should throw if used outside provider

```typescript
const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
```

### Naming Conventions

- **Components**: PascalCase (`Button`, `AuthProvider`)
- **Hooks**: camelCase with `use` prefix (`useAuth`, `useTheme`)
- **Utilities**: camelCase (`cn`, `formatDate`)
- **Variants**: camelCase (`default`, `destructive`, `outline`)
- **Classes**: kebab-case (`bg-primary`, `native:h-12`)

### File Structure

```
app/                    # Expo Router pages (file-based routing)
  (authenticated)/     # Route group for auth-only pages
  (unauthenticated)/   # Route group for public pages
  _layout.tsx          # Shared layouts
components/
  ui/                  # shadcn/ui-style primitives
  others/              # Feature-specific components
lib/                   # Utilities, Supabase client, constants
contexts/              # React Context providers
hooks/                 # Custom React hooks
database.types.ts      # Supabase type definitions
global.css             # Tailwind + CSS variables
tailwind.config.js     # Tailwind configuration
components.json        # shadcn/ui configuration
```

### Context Providers Pattern

```typescript
interface ContextType { /* ... */ }
const Context = createContext<ContextType | undefined>(undefined);

export function Provider({ children }: { children: React.ReactNode }) {
  const value = useMemo<ContextType>(/* ... */, [dependencies]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useContextName() {
  const c = useContext(Context);
  if (c === undefined) throw new Error("useX must be used within Provider");
  return c;
}
```

## Testing

No test framework is currently configured. When adding tests:
- Use Jest or Vitest for unit tests
- Place tests alongside components: `Component.test.tsx`
- Use `describe()` blocks for component/feature grouping

## Common Patterns

- **Auth Flow**: Apple Authentication via expo-apple-authentication, Supabase for session management
- **Navigation**: Expo Router with route groups `(authenticated)`, `(unauthenticated)`, `(onboarding)`
- **Database**: Supabase with typed schema from `database.types.ts`
- **State Management**: React Context for auth/theme, local state elsewhere
