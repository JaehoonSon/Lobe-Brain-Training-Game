# Brain App Design System ("The Juicy Spec")

This document outlines the UI guidelines, typography specs, and component standards for the Brain App. Our design philosophy is **"Juicy, Tactile, & Pop"** — specifically standardized on a **Mobile-First** consistency.

## 1. Core Principles
*   **Tactile**: Everything should feel touchable. We use **thick borders** (`2px` sides, `4px` bottom) to create a permanent 3D effect.
*   **High Contrast**: Text must be legible. We use **Orange (Primary)** and **Purple (Secondary)** against clean backgrounds.
*   **Rounded**: We adhere strictly to `rounded-xl` (12px) or `rounded-2xl` (16px) for containers. Sharp corners are banned.

---

## 2. Color Palette
We use CSS variables defined in `global.css` mapped to Tailwind classes.

| Semantic Name | Tailwind Class | Style | Usage |
| :--- | :--- | :--- | :--- |
| **Primary** | `bg-primary` | **Deep Orange** (`#fa8b4b`) | Main Actions, "Active" States, Key Highlights |
| **Secondary** | `bg-secondary` | **Vivid Purple** (`#d925b5`) | "Relaxing" Games, Creative categories, Secondary Highlights |
| **Muted** | `bg-muted` | **Light Grey/Slate** | Locked states, secondary backgrounds, disabled items |
| **Background** | `bg-background` | **White / Dark Grey** | Page backgrounds |

### The "Edge" System
To achieve the 3D effect, every color has a corresponding "Edge" shade (darker) for the bottom border.
*   `border-primary-edge`
*   `border-secondary-edge`

---

## 3. Typography
**Font Family**: `Nunito` (Rounded sans-serif).
**Weights**: We default to **Bold (700)** or **SemiBold (600)** for almost everything to maintain the "Juicy" feel.
**Mobile Scale (Updated - "Big & Reachable")**:

| Element | Size | Tailwind Class | Guidelines |
| :--- | :--- | :--- | :--- |
| **Page Title** | 30px | `text-3xl font-bold` | Top of screen headers ("Today's Training"). |
| **Section Header**| 24px | `text-2xl font-bold` | Major sections ("Relaxing Games"). |
| **Card Title** | 18px - 20px | `text-lg` / `text-xl` | Game names. **Default to lg/xl.** |
| **Body** | 16px - 18px | `text-base` / `text-lg` | Standard reading text. **Never use text-sm for body.** |
| **Subtitle/Meta**| 14px - 16px | `text-sm` / `text-base` | Metadata. Use `text-base` if space permits. |
| **Micro/Label** | 14px | `text-sm font-bold` | Caps labels (e.g., "UNLOCK"). **Avoid text-xs (12px) unless absolutely necessary.** |

**Rule of Thumb**: 
1. **16px (text-base) is the new minimum** for readability.
2. If in doubt, **bump it up**. Mobile screens need big touch targets and big type.

---

## 4. Component Specs

### 4.1. Dashboard Cards (Full Color)
Used specifically for the Stats/Dashboard to create a high-impact, gamified look.

| Variant | Background | Text Color | Usage |
| :--- | :--- | :--- | :--- |
| **Hero Card** | `bg-primary` (Orange) | `text-white` | Main KPI / Brain Index |
| **List Card** | `bg-secondary` (Purple) | `text-white` | Resource Pools / Category Lists |

> [!IMPORTANT]
> **No White Cards on Stats Page**: The Stats page must use "Full Color" cards to avoid a "medical chart" aesthetic.

### 4.2. Cards (`Card`)
The fundamental building block.
*   **Border Radius**: `rounded-xl` (12px)
*   **Border Width**: `border-2` (sides/top), `border-b-4` (bottom)
*   **Border Color**: `border-border` (default grey) or `border-primary-edge` (active variants).
*   **Shadow**: None (the border-b-4 provides the depth).
*   **Image Clipping**: Use `frameMode={true}` if the card contains a full-bleed image.

```tsx
// Standard Content Card
<Card>
  <H4>Title</H4>
  <P>Content</P>
</Card>

// Image Card (Games)
<Card frameMode className="h-[110px]">
  <Image style={{ borderRadius: 12 }} ... />
</Card>
```

### Buttons (`Button`)
*   **Height**: `h-12` (48px min touch target).
*   **Interaction**: On press, `translate-y-1` and `border-b-0` (physically depresses).
*   **Variants**:
    *   `default` (Orange): Primary CTA
    *   `secondary` (Purple): Alternative CTA
    *   `outline`: Ghost/Secondary actions

### Icons
*   **Library**: `lucide-react-native`
*   **Size**: Defaults to `24px`.
*   **Stroke**: Default `strokeWidth={2}`.
*   **Color**: Use semantic colors (`text-primary`, `text-accent`), avoid hardcoded hexes.

---

## 5. Spacing & Layout
*   **Page Container**: `flex-1 bg-background`
*   **Horizontal Padding**: `px-6` (24px). The standard gutter for our app providing breathing room.
*   **Vertical Spacing**: `gap-4` (16px) or `gap-6` (24px) between distinct sections.
*   **Safe Area**: Always wrap screens in `<SafeAreaView edges={['top']}>`.

## 6. Common Patterns
*   **Lists**: Use `ScrollView` with `contentContainerStyle={{ paddingBottom: 100 }}` to ensure content isn't hidden behind the bottom tab bar.
*   **Locked Content**: Use `opacity-60` on the container and overlay a `Lock` icon.
*   **Empty States**: Use `Card` with `variant="muted"` and a centered icon.
