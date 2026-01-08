# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds Expo Router screens and route groups (e.g., `app/(unauthenticated)/...`).
- `components/` contains shared UI building blocks.
- `contexts/` provides React context providers used across the app.
- `lib/` stores utilities and typed API clients (Supabase types live in `lib/database.types.ts`).
- `assets/` stores images, fonts, and animations used by the UI.
- `config/` contains project configuration helpers.
- `scripts/` holds one-off maintenance or data scripts.
- `supabase/` includes database migrations and local Supabase config.
- Styling is driven by `global.css` and `tailwind.config.js` (NativeWind).

## Build, Test, and Development Commands
- `npm run dev`: start the Expo dev server and clear cache.
- `npm run dev:ios` / `npm run dev:android` / `npm run dev:web`: launch for a specific platform.
- `npm run lint`: run Expo ESLint checks.
- `npm run clean`: remove `.expo` and `node_modules` (use with care).
- `npm run db:link`: link local Supabase project.
- `npm run db:new`: create a new Supabase migration.
- `npm run db:push`: push local migrations to Supabase.
- `npm run db:types`: regenerate TypeScript types from Supabase.

## Coding Style & Naming Conventions
- TypeScript is strict (`tsconfig.json`), and ESLint uses `eslint-config-expo`.
- Match existing formatting (2-space indentation in JS/JSON).
- Component files use `PascalCase.tsx`; hooks use `useThing.ts`.
- Prefer the `~` path alias (e.g., `~/components/Button`).
- Tailwind/NativeWind utility classes live in `className`; shared tokens should be added to `tailwind.config.js`.

## Testing Guidelines
- No automated test runner is configured. Validate changes by running the app in Expo.
- If you add tests, include a new npm script and document the runner in this file.

## Commit & Pull Request Guidelines
- Commit messages are short, sentence-case, imperative (see `git log` examples).
- PRs should include: a clear description, linked issues, testing notes, and screenshots for UI changes.

## Security & Configuration Tips
- Keep secrets in `.env`; never commit credentials.
- Supabase schema changes should go through migrations in `supabase/`.
