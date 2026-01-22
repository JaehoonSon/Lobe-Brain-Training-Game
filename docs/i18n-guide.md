# Internationalization (i18n) Guide

This guide documents the internationalization setup for Brain App and provides step-by-step instructions for adding new translations.

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Adding a New Translatable String](#adding-a-new-translatable-string)
5. [Adding a New Language](#adding-a-new-language)
6. [Best Practices](#best-practices)
7. [Testing Translations](#testing-translations)
8. [Common Patterns](#common-patterns)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Brain App uses `react-i18next` combined with `expo-localization` to provide a seamless, device-aware localization experience. The app automatically detects the user's device language and loads the appropriate translations, falling back to English if the detected language isn't supported.

**Currently Supported Languages:**
- English (`en`) - Default/Fallback
- Spanish (`es`)

---

## Technology Stack

| Library | Purpose |
|---------|---------|
| `i18next` | Core internationalization framework |
| `react-i18next` | React bindings for i18next |
| `expo-localization` | Detects device locale settings |

---

## Project Structure

```
brain-app/
├── assets/
│   └── locales/
│       ├── en.json          # English translations
│       └── es.json          # Spanish translations
├── lib/
│   └── i18n.ts              # i18n configuration and initialization
└── ... (components using useTranslation hook)
```

### Key Files

#### `lib/i18n.ts`
This file initializes i18next, loads locale resources, and configures the language detection.

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from '../assets/locales/en.json';
import es from '../assets/locales/es.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
};

const getDeviceLocale = () => {
  const locales = Localization.getLocales();
  if (locales && locales.length > 0) {
    return locales[0].languageCode ?? 'en';
  }
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLocale(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
```

#### `assets/locales/en.json` & `es.json`
These JSON files contain all translatable strings, organized by namespace.

---

## Adding a New Translatable String

Follow these steps whenever you add new user-facing text to the app.

### Step 1: Identify the String

Find the hardcoded string in your component. For example:

```tsx
<Text>Welcome back!</Text>
```

### Step 2: Choose a Namespace and Key

Organize keys logically by feature or screen. Use dot notation for nesting.

**Naming Convention:**
- `common.*` - Shared across the app (buttons, errors, labels)
- `dashboard.*` - Today/Dashboard screen
- `games_tab.*` - Games screen
- `stats.*` - Stats screen
- `insights.*` - Insights screen
- `settings.*` - Settings screen
- `onboarding.*` - Onboarding flow
- `unauth.*` - Unauthenticated screens (landing, signup, login)

**Example Key:** `dashboard.welcome_message`

### Step 3: Add the Key to Translation Files

**`en.json`:**
```json
{
    "dashboard": {
        "welcome_message": "Welcome back!"
    }
}
```

**`es.json`:**
```json
{
    "dashboard": {
        "welcome_message": "¡Bienvenido de nuevo!"
    }
}
```

> [!IMPORTANT]
> Always update **both** `en.json` and `es.json` at the same time. Missing keys will fall back to English, but this creates an inconsistent experience.

### Step 4: Use the Translation in Your Component

Import the `useTranslation` hook and replace the hardcoded string:

```tsx
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation();

  return (
    <Text>{t('dashboard.welcome_message')}</Text>
  );
}
```

---

## Adding a New Language

### Step 1: Create the Locale File

Create a new JSON file in `assets/locales/` (e.g., `fr.json` for French).

```json
{
    "common": {
        "welcome": "Bienvenue à Brain App",
        ...
    },
    ...
}
```

> [!TIP]
> Copy `en.json` as a starting point and translate each value.

### Step 2: Register the Locale in `i18n.ts`

```typescript
import en from '../assets/locales/en.json';
import es from '../assets/locales/es.json';
import fr from '../assets/locales/fr.json'; // Add this

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr }, // Add this
};
```

### Step 3: Test the New Language

Temporarily force the language for testing:

```typescript
i18n.init({
  // ...
  lng: 'fr', // Force French for testing
  // ...
});
```

> [!CAUTION]
> Remember to revert this to `getDeviceLocale()` before committing!

---

## Best Practices

### 1. Use Interpolation for Dynamic Values

Don't concatenate strings. Use interpolation instead.

**❌ Bad:**
```tsx
<Text>{"Hello, " + userName + "!"}</Text>
```

**✅ Good:**
```json
// en.json
{ "greeting": "Hello, {{name}}!" }
```
```tsx
<Text>{t('greeting', { name: userName })}</Text>
```

### 2. Use Pluralization When Needed

i18next supports pluralization out of the box.

```json
// en.json
{
  "sessions_count": "{{count}} session",
  "sessions_count_plural": "{{count}} sessions"
}
```
```tsx
t('sessions_count', { count: 5 }) // "5 sessions"
t('sessions_count', { count: 1 }) // "1 session"
```

### 3. Keep Keys Consistent Across Locales

Both locale files must have the same structure. Use a diff tool to compare them:

```bash
diff assets/locales/en.json assets/locales/es.json
```

### 4. Avoid Translating Technical Content

Do **not** translate:
- Database-loaded content (game names, category names from DB)
- API error codes
- URLs
- Identifiers

### 5. Provide Context for Translators

If a string is ambiguous, add a comment in the JSON (using a `_comment` key pattern) or document it elsewhere.

```json
{
  "_comment_sessions_finished": "Displayed on the dashboard showing community activity",
  "sessions_finished": "{{count}} Sessions Finished Today"
}
```

### 6. Handle Long Translations Gracefully

Some languages produce longer text than English. Design your UI to:
- Allow text wrapping
- Use flexible containers
- Avoid fixed widths for text elements
- Test with longer translations (German and Spanish are good benchmarks)

---

## Testing Translations

### Method 1: Force a Language in `i18n.ts`

```typescript
lng: 'es', // Force Spanish
```

### Method 2: Change Device Language

1. Go to your device/simulator settings
2. Change the system language
3. Restart the app

### Method 3: Add a Language Switcher (Dev Only)

```tsx
import i18n from '~/lib/i18n';

function DevLanguageSwitcher() {
  return (
    <View>
      <Button title="EN" onPress={() => i18n.changeLanguage('en')} />
      <Button title="ES" onPress={() => i18n.changeLanguage('es')} />
    </View>
  );
}
```

---

## Common Patterns

### Translating with Default Values

Useful for content that may not have a translation key (like database-loaded categories):

```tsx
t(`common.categories.${category.toLowerCase()}`, { defaultValue: category })
```

### Conditional Translations

```tsx
{isPro 
  ? t('settings.labels.pro_member')
  : t('settings.labels.free_member')}
```

### Translating Arrays/Lists

For static lists (like onboarding options), store them as arrays in the JSON:

```json
{
  "options": [
    "Option 1",
    "Option 2",
    "Option 3"
  ]
}
```

Access with index:
```tsx
t('onboarding.steps.interests.options.0') // "Option 1"
```

Or map over the length:
```tsx
const options = [0, 1, 2].map(i => t(`onboarding.steps.interests.options.${i}`));
```

---

## Troubleshooting

### Issue: Translation Not Showing (Key Displayed Instead)

**Cause:** The key doesn't exist in the locale file.

**Fix:**
1. Check for typos in the key
2. Verify the key exists in both `en.json` and `es.json`
3. Check that the path is correct (e.g., `common.loading` vs `common.loading.text`)

### Issue: Interpolation Not Working

**Cause:** Mismatch between template variable and passed object.

**Fix:** Ensure the variable name in `{{variableName}}` matches the key in the options object.

```tsx
// JSON: "Hello, {{name}}!"
t('greeting', { name: 'John' }) // ✅ Correct
t('greeting', { userName: 'John' }) // ❌ Wrong key
```

### Issue: Language Not Changing

**Cause:** The app may cache the initial language.

**Fix:**
1. Fully restart the app (not just hot reload)
2. Clear the Metro cache: `npx expo start --clear`

### Issue: Special Characters Not Rendering

**Cause:** Encoding issues in JSON files.

**Fix:** Ensure locale files are saved with UTF-8 encoding.

---

## Locale File Structure Reference

Here's the current structure of the translation files for reference:

```
├── common          # Shared strings (buttons, errors, category names)
├── home            # Home screen (currently minimal)
├── unauth          # Unauthenticated screens
│   ├── landing
│   ├── signup
│   └── welcome
├── onboarding      # Onboarding flow
│   ├── steps
│   │   ├── birthday
│   │   ├── interests
│   │   ├── affirmations
│   │   ├── goals
│   │   ├── profile
│   │   ├── difficulty
│   │   ├── encouragement
│   │   ├── frequency
│   │   └── sleep
│   └── games
├── settings        # Settings screen
├── dashboard       # Today screen
│   ├── daily_insight
│   ├── community
│   └── quick_play
├── games_tab       # Games screen
│   ├── sections
│   └── categories
├── stats           # Stats screen
│   ├── bpi
│   ├── categories
│   └── analysis
└── insights        # Insights screen
    ├── daily_read
    └── explore
```

---

## Checklist for New Features

When building a new feature, use this checklist:

- [ ] Identify all user-facing strings
- [ ] Choose appropriate namespaces and keys
- [ ] Add keys to `en.json`
- [ ] Add keys to `es.json`
- [ ] Import `useTranslation` in the component
- [ ] Replace hardcoded strings with `t()` calls
- [ ] Test in both English and Spanish
- [ ] Verify UI layout with longer translations

---

*Last updated: January 2026*
