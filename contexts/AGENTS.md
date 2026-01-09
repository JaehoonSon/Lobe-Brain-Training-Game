# CONTEXTS GUIDE

React Context providers for global state management.

## WHERE TO LOOK
| Context | Location |
|---------|----------|
| Authentication | `contexts/AuthProvider.tsx` |
| Theme | `contexts/ThemeContext.tsx` |
| Games | `contexts/GamesContext.tsx` |
| Onboarding | `contexts/OnboardingContext.tsx` |
| Revenue | `contexts/RevenueCatProvider.tsx` |

## CONVENTIONS
- **Pattern**: Context + Provider component + custom hook
- **Context type**: Define interface, initialize with `createContext<Type | undefined>(undefined)`
- **Provider**: Wrap children, memoize value with `useMemo`
- **Hook**: `useContext()` with throw if undefined (used outside provider)

```typescript
const Context = createContext<ContextType | undefined>(undefined);

export function Provider({ children }: { children: React.ReactNode }) {
  const value = useMemo<ContextType>(/* ... */, [deps]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useContextName() {
  const context = useContext(Context);
  if (context === undefined) throw new Error("useX must be used within Provider");
  return context;
}
```

- **State**: Use `useState` or `useReducer` for local state
- **Side effects**: `useEffect` for initialization/subscriptions
- **Cleanup**: Return cleanup function from `useEffect`

## ANTI-PATTERNS
- **NEVER** skip throw in custom hook (breaks type safety)
- **NEVER** use context directly without custom hook
- **NEVER** put large objects in context value without memoization
- **NEVER** create nested providers for same concern
- **NEVER** mix concerns in single context provider

## NOTES
- AuthProvider manages Supabase session with AsyncStorage persistence
- All providers are nested in root layout
- Debug logging present in AuthProvider for state transitions
