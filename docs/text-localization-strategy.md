# Text Localization Strategy Guide

This document outlines the structural guide for handling hardcoded (UI) text versus database-driven content in the Brain App. It explains when to use each system, the architecture behind them, and the workflow for adding new localized strings.

---

## 1. Overview: Dual-Layer Localization

Brain App uses two distinct systems for localization based on the source and nature of the text:

1.  **Layer 1: Static UI Localization (i18next)**
    *   **Source**: Local JSON files in `assets/locales/`.
    *   **Purpose**: Hardcoded UI elements like buttons, labels, headers, and navigation items.
2.  **Layer 2: Database Content Localization (Supabase)**
    *   **Source**: `content_translations` table in Supabase.
    *   **Purpose**: Dynamic content stored in the database, such as game names, descriptions, categories, and daily insights.

---

## 2. Decision Matrix

Use the following table to decide where to place new text:

| Text Type | Location | Examples |
| :--- | :--- | :--- |
| **Static UI Strings** | `assets/locales/*.json` | "Start Game", "Settings", "Level", "Login" |
| **User Notifications** | `assets/locales/*.json` | "Workout completed!", "Great job!" |
| **Game Data** | `content_translations` table | Game Name, Game Description, Instructions |
| **Category Data** | `content_translations` table | Category Name (e.g., "Memory", "Speed") |
| **Daily Insights** | `content_translations` table | Factoids, sources, and educational content |

---

## 3. Architecture & Workflow

### Layer 1: Static UI Localization

Powered by `i18next` and `react-i18next`.

#### Key Files
- `assets/locales/*.json`: Locale-specific key-value pairs.
- `lib/i18n.ts`: Initialization and language detection logic.

#### Implementation Workflow
1.  **Add Key**: Add the string to `assets/locales/en.json` and all other supported locale files.
2.  **Naming Convention**: Use dot notation grouped by feature/screen.
    *   Example: `dashboard.welcome_message`, `common.buttons.cancel`.
3.  **Usage**:
    ```tsx
    import { useTranslation } from 'react-i18next';

    const { t } = useTranslation();
    return <Text>{t('dashboard.welcome_message')}</Text>;
    ```

---

### Layer 2: Database Content Localization

Powered by a custom translation table and utility functions.

#### Key Files
- `lib/content-translations.ts`: Core utilities for fetching and resolving DB translations.
- `lib/locale.ts`: Normalizes locale codes (e.g., `en-US` -> `en`).
- `supabase/migrations/`: Contains the `content_translations` table definition.

#### Schema: `content_translations`
| Field | Type | Description |
| :--- | :--- | :--- |
| `entity_type` | `text` | Type of content (`game`, `category`, `insight`) |
| `entity_id` | `text` | UUID or Slug of the base record |
| `field` | `text` | The specific column being translated (`name`, `description`) |
| `locale` | `text` | Normalized locale code (e.g., `es`, `ko`) |
| `text` | `text` | The translated content |

#### Implementation Workflow
1.  **Insert Translation**: Add a row to the `content_translations` table.
2.  **Fetch & Resolve**:
    ```tsx
    // 1. Fetch translations for the specific entities
    const translations = await fetchContentTranslations(
      "game", 
      [gameId], 
      ["name", "description"], 
      locale
    );

    // 2. Build a map for easy lookup
    const translationMap = buildTranslationMap(translations);

    // 3. Resolve with a fallback to the base record
    const localizedName = resolveTranslation(
      translationMap, 
      gameId, 
      "name", 
      baseGame.name
    );
    ```

---

## 4. System Flow Diagram

```ascii
+---------------------------+       +---------------------------+
|      Static UI Text       |       |     Dynamic DB Content    |
| (Buttons, Labels, etc.)   |       | (Games, Insights, etc.)   |
+-------------+-------------+       +-------------+-------------+
              |                                   |
              v                                   v
    +---------+---------+               +---------+---------+
    | assets/locales/*.json |           | content_translations |
    |      (JSON Files)     |           |   (Supabase Table)    |
    +---------+---------+               +---------+---------+
              |                                   |
              v                                   v
    +---------+---------+               +---------+---------+
    |    lib/i18n.ts    |               | lib/content-trans.ts|
    |  (react-i18next)  |               | (Custom Resolver)   |
    +---------+---------+               +---------+---------+
              |                                   |
              +-----------------+-----------------+
                                |
                                v
                   +------------+------------+
                   |       React Native      |
                   |       (UI Layer)        |
                   +-------------------------+
```

---

## 5. Supported Locales

The app currently supports the following locale codes (normalized via `lib/locale.ts`):

*   **en**: English (Default)
*   **es**: Spanish
*   **ko**: Korean
*   **zh**: Chinese (Simplified)
*   **ja**: Japanese
*   **pt**: Portuguese
*   **de**: German
*   **fr**: French
*   **hi**: Hindi
*   **ru**: Russian

---

## 6. Best Practices

1.  **Fallback Mechanism**: Always provide the base record field as a fallback in `resolveTranslation`.
2.  **Context Synchronization**: When using database content, ensure the `locale` state is synced with `i18n.language` (see `GamesContext.tsx` or `useDailyInsight.ts` for patterns).
3.  **Naming Consistency**:
    *   i18n keys: `snake_case` with dot separation (`stats.daily_average`).
    *   Database entities: Match the table name (`game`, `category`, `insight`).
4.  **No Direct Modification**: Do not modify `lib/database.types.ts` to add localized fields; keep the original fields in English and use the translation layer.
