# Internationalization (i18n) Guide

This guide documents how to add localized text to Brain App. Follow these patterns to ensure all new code is translation-ready.

---

## Quick Decision: Which System to Use?

| Text Type                                          | System          | Location                     |
| -------------------------------------------------- | --------------- | ---------------------------- |
| **UI strings** (buttons, labels, headers)          | i18next         | `assets/locales/*.json`      |
| **User messages** (toasts, alerts, errors)         | i18next         | `assets/locales/*.json`      |
| **Database content** (games, categories, insights) | DB translations | `content_translations` table |

> **Rule of thumb:** If the text is hardcoded in `.tsx` files → use i18next. If it comes from the database → use `content_translations`.

---

## Supported Languages

| Code | Language             |
| ---- | -------------------- |
| `en` | English (Default)    |
| `es` | Spanish              |
| `ko` | Korean               |
| `zh` | Chinese (Simplified) |
| `ja` | Japanese             |
| `pt` | Portuguese           |
| `de` | German               |
| `fr` | French               |
| `hi` | Hindi                |
| `ru` | Russian              |

---

## Part 1: Static UI Text (i18next)

Use this for any text hardcoded in React components.

### Step 1: Add the Key to Locale Files

**`assets/locales/en.json`:**

```json
{
  "dashboard": {
    "welcome_message": "Welcome back!"
  }
}
```

**`assets/locales/es.json`:**

```json
{
  "dashboard": {
    "welcome_message": "¡Bienvenido de nuevo!"
  }
}
```

> [!IMPORTANT]
> Always update **all** locale files at the same time. Missing keys fall back to English.

### Step 2: Use in Component

```tsx
import { useTranslation } from "react-i18next";

export function MyComponent() {
  const { t } = useTranslation();
  return <Text>{t("dashboard.welcome_message")}</Text>;
}
```

### Namespace Conventions

| Prefix         | Use For                          |
| -------------- | -------------------------------- |
| `common.*`     | Shared (buttons, errors, labels) |
| `dashboard.*`  | Today/Home screen                |
| `games_tab.*`  | Games screen                     |
| `stats.*`      | Stats screen                     |
| `insights.*`   | Insights screen                  |
| `settings.*`   | Settings screen                  |
| `onboarding.*` | Onboarding flow                  |
| `unauth.*`     | Login/signup screens             |
| `game.*`       | Game detail/play screens         |

### Dynamic Values (Interpolation)

**❌ Don't concatenate:**

```tsx
<Text>{"Hello, " + userName + "!"}</Text>
```

**✅ Use interpolation:**

```json
{ "greeting": "Hello, {{name}}!" }
```

```tsx
<Text>{t("greeting", { name: userName })}</Text>
```

### Pluralization

```json
{
  "sessions_count": "{{count}} session",
  "sessions_count_plural": "{{count}} sessions"
}
```

```tsx
t("sessions_count", { count: 5 }); // "5 sessions"
t("sessions_count", { count: 1 }); // "1 session"
```

---

## Part 2: Database Content (content_translations)

Use this for content stored in the database (games, categories, insights).

### Schema

The `content_translations` table stores translations:

| Column        | Description                                           |
| ------------- | ----------------------------------------------------- |
| `entity_type` | `game`, `category`, or `insight`                      |
| `entity_id`   | UUID or slug of the record                            |
| `field`       | Column being translated (`name`, `description`, etc.) |
| `locale`      | Language code (`es`, `ko`, etc.)                      |
| `text`        | The translated content                                |

### Usage Pattern

```tsx
import {
  buildTranslationMap,
  fetchContentTranslations,
  resolveTranslation,
} from "~/lib/content-translations";

// 1. Fetch translations
const translations = await fetchContentTranslations(
  "game",
  [gameId],
  ["name", "description"],
  locale,
);

// 2. Build lookup map
const translationMap = buildTranslationMap(translations);

// 3. Resolve with fallback
const localizedName = resolveTranslation(
  translationMap,
  gameId,
  "name",
  baseGame.name, // Fallback to English
);
```

### Key Files

| File                          | Purpose                                 |
| ----------------------------- | --------------------------------------- |
| `lib/content-translations.ts` | Fetch and resolve translations          |
| `lib/locale.ts`               | Normalize locale codes (`en-US` → `en`) |

---

## Checklist for New Features

When adding new text to the app:

- [ ] Identify all user-facing strings
- [ ] Decide: UI string (i18next) or DB content (content_translations)?
- [ ] For i18next:
  - [ ] Add key to `assets/locales/en.json`
  - [ ] Add key to all other locale files (`es.json`, etc.)
  - [ ] Use `t('key')` in component
- [ ] For database content:
  - [ ] Ensure translations exist in `content_translations` table
  - [ ] Use the `resolveTranslation` pattern with fallback
- [ ] Test with different languages

---

## Testing Translations

### Force a Language (Development)

In `lib/i18n.ts`, temporarily change:

```typescript
lng: 'es', // Force Spanish
```

> [!CAUTION]
> Revert to `getDeviceLocale()` before committing!

### Clear Cache After Changes

```bash
npx expo start --clear
```

---

## Key Files Reference

```
brain-app/
├── assets/locales/
│   ├── en.json       # English (source of truth)
│   ├── es.json       # Spanish
│   ├── ko.json       # Korean
│   ├── zh.json       # Chinese
│   ├── ja.json       # Japanese
│   ├── pt.json       # Portuguese
│   ├── de.json       # German
│   ├── fr.json       # French
│   ├── hi.json       # Hindi
│   └── ru.json       # Russian
├── lib/
│   ├── i18n.ts                   # i18next initialization
│   ├── locale.ts                 # Locale normalization
│   └── content-translations.ts   # DB translation utilities
```

---

## Common Mistakes

| Mistake                            | Fix                                            |
| ---------------------------------- | ---------------------------------------------- |
| Hardcoded string in component      | Use `t('key')` instead                         |
| String concatenation               | Use interpolation `{{variable}}`               |
| Missing key in non-English locale  | Add to all locale files                        |
| Forgetting fallback for DB content | Always pass `fallback` to `resolveTranslation` |

---

_Last updated: January 2026_
