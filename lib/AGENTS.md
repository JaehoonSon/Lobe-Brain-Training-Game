# LIBRARY UTILITIES GUIDE

Utilities, Supabase client, icons, validators, and shared logic.

## WHERE TO LOOK

| Task              | Location                |
| ----------------- | ----------------------- |
| Supabase client   | `lib/supabase.ts`       |
| Type definitions  | `lib/database.types.ts` |
| Utility functions | `lib/utils.ts`          |
| Icons             | `lib/icons/`            |
| Validators        | `lib/validators/`       |
| Themes            | `lib/themes.ts`         |
| Scoring logic     | `lib/scoring.ts`        |

## CONVENTIONS

- **Supabase client**: Use typed client from `lib/supabase.ts`, types from `database.types.ts`
- **Utility functions**: Named exports (cn, formatDate, etc.)
- **Icons**: Functional components with className prop, wrapped in iconWithClassName
- **Validators**: Zod schemas, export type from schema
- **Error handling**: ALWAYS throw after Supabase ops: `if (error) throw error;`

## ANTI-PATTERNS

- **NEVER** modify `lib/database.types.ts` - regenerate with `npm run db:types`
- **NEVER** create duplicate Supabase client instances
- **NEVER** commit environment variables (use process.env)
- **NEVER** ignore Supabase errors - always check and throw
- **NEVER** hardcode database IDs - use constants from database.types.ts

## NOTES

- `cn()` merges Tailwind classes (clsx + tailwind-merge)
- Icons use Lucide React Native, wrapped for consistent className support
- Theme utilities manage color scheme and light/dark mode
- Scoring logic handles game session calculations
