# Mobile App UI/UX Guidelines & Design System

> **Target Audience:** AI Agents & Developers
> **Goal:** Maintain a consistent "Juicy", "Tactile", and "Premium" aesthetic across the application.

## 1. Core Design Philosophy
The application follows a **"Juicy"** design language. It should feel fun, tactile, and substantial.
*   **Tactile**: Elements should look like they can be touched. Use 3D effects (thick bottom borders) to give depth.
*   **Pop**: High contrast, bold colors against clean backgrounds.
*   **Rounded**: heavy use of `rounded-xl` to `rounded-3xl`. Sharp corners are forbidden unless intentionally brutalist (not typical here).
*   **Boldness**: Typography is heavy. We almost never use `font-light` or `font-thin`.

## 2. Typography
**Font Family:** `Nunito` (via NativeWind/Tailwind utility classes).

| Role | Weight Class | Tailwind Class | Notes |
| :--- | :--- | :--- | :--- |
| **Hero Numbers** | Black (900) | `font-black` | Used for BPI scores, primary stats. |
| **Page Titles** | Black (900) | `font-black` | Main screen headers (e.g., "My Stats"). |
| **Section Headers** | Black (900) | `font-black` | H2/H3 equivalents. |
| **Card Titles** | Black (900) | `font-black` | Titles inside functional cards. |
| **Button Text** | Bold (700) or Black (900) | `font-bold` / `font-black` | Actionable text must be heavy. |
| **Body Text** | SemiBold (600) or Bold (700) | `font-semibold` / `font-bold` | Even body text leans heavy for readability. |
| **Labels/Hints** | Medium (500) | `font-medium` | Only for secondary metadata. |

**⛔ DON'T**: Use `font-normal` (400) for primary content. It looks too spindly in this design system.

## 3. Colors & The "Edge" System
We use a standard primary/secondary system with a twist: **Edge Colors**.
Every main color has a corresponding `-edge` variant used for the "3D" bottom border effect.

| Role | Main Color | Edge Color | Usage |
| :--- | :--- | :--- | :--- |
| **Primary** | `bg-primary` | `border-primary-edge` | Main actions, hero cards, positive states. |
| **Secondary** | `bg-secondary` | `border-secondary-edge` | Secondary actions, alternative highlights. |
| **Accent** | `bg-accent` | `border-accent-edge` | Special highlights (rare). |
| **Destructive** | `bg-destructive` | `border-destructive-edge` | Delete, Remove, Danger zones. |


## 3.1 Color Usage & Meaning
The app uses a strict **Primary (Orange)** and **Secondary (Purple)** pairing.

| Color | Role | Best Practice |
| :--- | :--- | :--- |
| **Primary (Orange)** | **Action & Hero** | Use for the main Call-to-Action (CTA), the "Hero" card on a page, and positive progress. It represents "Energy" and "Activity". |
| **Secondary (Purple)** | **Data & Depth** | Use for secondary data points, comparison charts, and alternating list items. It represents "Wisdom" and "Analysis". |
| **Accent (Pink)** | **Highlight** | Use sparingly for "New" badges, special notifications, or breaking up the Orange/Purple rhythm. |

### The "Rhythmic Pairing" Rule
For lists or grids of similar items (like the Stats page categories), **alternate** between Primary and Secondary styles.
*   Item 1: Primary (Orange Icon/Bar)
*   Item 2: Secondary (Purple Icon/Bar)
*   Item 3: Primary...
This prevents the UI from becoming overwhelming with a single color and enhances the "Juicy" feel.

### Surface Dominance
While we love "Juicy" colors, they only pop if they have room to breathe.
*   **The 60% Rule**: At least 60-70% of the screen pixel area should be `bg-background` (Warm Alabaster/White).
*   **Avoid Over-Saturation**: Do not make entire page backgrounds Orange or Purple. Use these colors for *objects* (Cards, Buttons, Pills) on top of the neutral background.
*   **White/Neutral Space**: is essential to make the "pop" elements actually pop.


## 4. Component Patterns

### A. The "Juicy" Card (Standard)
All cards have a 3D effect with `overflow-hidden` for clean corners.
**Key Props/Classes:**
*   `border-2` (sometimes `border-0` if using just bottom)
*   `border-b-4` (The 3D shadow)
*   `rounded-xl` or `rounded-2xl`
*   `border-muted` or `border-[color]-edge`
*   `overflow-hidden` (applied automatically)

### B. "Floating Pill" Headers
Headers inside cards or lists often use the "Floating Pill" style.
```tsx
<View className="px-4 py-1.5 rounded-full border-b-4 bg-primary border-primary-edge">
  <Text className="text-lg font-black text-white">Title</Text>
</View>
```
*   **Shape**: Fully rounded (`rounded-full`).
*   **Depth**: `border-b-4`.
*   **Content**: White text, `font-black`.

### C. Button Variants
We distinguish between "Juicy" (3D) and "Flat" (Outline/Ghost) buttons.

#### 1. Juicy Buttons (Primary Action)
High-emphasis actions meant to be pressed.
*   **Variant:** `default`, `secondary`, `destructive`
*   **Style:** `border-b-4`.
*   **Behavior:** On press, the border collapses (`active:border-b-0 active:translate-y-1`).
*   **Classes:** `bg-primary border-primary-edge`, `bg-secondary border-secondary-edge`.

#### 2. Flat Buttons (Secondary Action)
Lower emphasis, used for secondary options or when valid screen real estate is scarce.
*   **Variant:** `outline`, `ghost`
*   **Style:** `border-2` (Thick outline). No heavy bottom edge (no 3D effect), but still substantial.
*   **Naming:** "Outline" (Thick) or "Ghost" (No border).
*   **Classes:** `border-2 border-input bg-background` (Outline).
*   **Note:** Avoid 1px borders; they look too thin against the rest of the "Juicy" design.

### D. Form & Input Elements
*   **Text Inputs:** Thicker borders than standard. Use `border-2` with `border-input`.
*   **Focus State:** High contrast ring `ring-2 ring-primary`.
*   **Radius:** `rounded-xl` matches buttons.

## 5. Animation & Motion
The "Juicy" feel relies on tactile responsiveness.
*   **Pressable Scale:** Interactive elements often scale down slightly on press (`0.95`).
*   **Transitions:** Spring animations are preferred over linear.
*   **Duration:** Snappy (~200ms).

## 6. Layout & Spacing
*   **Screen Padding:** `px-6` is the standard horizontal padding for main views.
*   **Section Spacing:** `gap-4` or `gap-6` between major cards.
*   **Safe Areas:** Always respect safe areas, specifically top edges on lists `edges={['top']}`.

## 7. Iconography
*   **Library:** `lucide-react-native`
*   **Stroke Width:** `strokeWidth={2.5}` or `3` (Bold). Standard is often too thin.
*   **Style:** `outline` usually, `filled` for active tab states.

## 8. Glassmorphism & Blur
For locked states or overlays:
*   **Component**: `BlurView` (from `expo-blur`).
*   **Intensity**: `70` (High intensity for premium frosted feel).
*   **Tint**: `"light"` (usually).
*   **Overlay Standard**: Locked content should be visible but unreadable under the blur.

## 9. Overlays & Modals
*   **Bottom Sheets**: Use for complex interactions.
    *   **Radius**: `rounded-t-3xl` (Large top radius).
    *   **Handle**: Visible handle bar `w-12 h-1.5 bg-muted rounded-full`.
*   **Dialogs/Alerts**: Use for critical confirmations.
    *   **Style**: Floating 3D Card centered on screen.
    *   **Backdrop**: `bg-black/40` or `bg-black/60`.

## 10. Typography Scale (Size)
While we use `H1`-`P` components, here are the raw expected sizes:
*   **Hero (BPI)**: `text-7xl` or higher.
*   **H1 (Page Title)**: `text-3xl` or `text-4xl`.
*   **H2 (Section)**: `text-2xl`.
*   **H3 (Card Title)**: `text-lg` or `text-xl`.
*   **Body**: `text-base` is standard. Avoid `text-sm` unless for metadata.

## 11. Dark Mode
The system is fully dark-mode compatible via CSS variables (`bg-background` etc).
*   **Rule**: Never hardcode hex values (e.g., `#FFFFFF`). Always use semantic classes (`bg-card`, `text-foreground`).
*   **Juicy Colors**: Primary/Secondary colors work in both modes, but ensure text contrast leads. In Dark mode, `text-primary-foreground` might toggle.

## 12. Code Snippets for Agents

**Standard Page Structure:**
```tsx
<SafeAreaView edges={["top"]} className="flex-1 bg-background">
  <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
     <View className="px-6 pb-6">
        <H1 className="text-3xl font-black mb-6">Page Title</H1>
        {/* Content */}
     </View>
  </ScrollView>
</SafeAreaView>
```

**Progress Bar Pattern:**
```tsx
<View className="flex-1 h-3 bg-muted/40 rounded-full overflow-hidden">
  <View
    className="h-full bg-primary rounded-full"
    style={{ width: `${percent}%` }}
  />
</View>
```

## 13. Checklist for Refactors
When refactoring a generic UI component to "Juicy" UI:
1.  [ ] **Bold Typography**: Upgrade `font-normal` to `font-bold` or `font-black`.
2.  [ ] **Round Corners**: Increase `rounded-md` to `rounded-xl`.
3.  [ ] **Add Depth**: Add `border-b-4` and appropriate edge colors to primary buttons/cards.
4.  [ ] **Fatten Icons**: Increase `strokeWidth` to 2.5 or 3.
5.  [ ] **Check Contrast**: Ensure text on colored pills is White (`text-white`).

## 14. Asset Generation Prompts (3D Claymorphism)

All game assets follow the **3D Claymorphism** style — a rendering technique that mimics soft, matte plasticine or clay animation to create a friendly, tactile look.

### A. Game Thumbnails (Banners)
**Dimensions:** 16:9 landscape (fits 180×110px cards)  
**Storage:** Supabase Storage → `game-assets/[game-name]_game.jpg`

**Base Prompt Template:**
```
3D Claymorphism scene in 16:9 landscape format. The entire image is a [THEMED ENVIRONMENT]—[DESCRIBE CLAY SURFACE AND ELEMENTS] extending edge-to-edge. Dead center: [MAIN OBJECT DESCRIPTION]. No borders, no vignette, the scene fills the entire frame seamlessly. Style: Plasticine texture, matte finish, soft lighting, cute, friendly, no text.
```

**Example Prompts:**

| Game | Prompt |
| :--- | :--- |
| **Memory Matrix** | 3D Claymorphism scene in 16:9 landscape format. The entire image is a clay "puzzle room" environment—a soft, matte clay surface with subtle embossed grid patterns and small scattered clay cubes extending edge-to-edge. Dead center: A prominent, floating 3x3 grid of soft clay tiles with rounded corners; some tiles glow green, others are off-white. No borders, no vignette. Style: Plasticine texture, matte finish, soft warm lighting, friendly, tactile, no text. |
| **Mental Arithmetic** | 3D Claymorphism scene in 16:9 landscape format. The entire image is a playful clay "math playground" environment—a soft pastel blue clay desk surface extending edge-to-edge, scattered with small clay abacus beads, tiny clay pencils, miniature clay dice, and faint embossed doodle scribbles. Dead center: Large, cute clay numbers (1, 2, 3) and math symbols (+, -, ×) floating playfully in bright primary colors. No borders, no vignette. Style: Plasticine texture with subtle fingerprint impressions, matte finish, soft warm lighting, friendly, tactile, no text. |
| **Language Discrimination** | 3D Claymorphism scene in 16:9 landscape format. The entire image is a serene clay "communication sky" environment—a smooth pale sky-blue clay surface extending edge-to-edge. Pressed into this background are simple white clay cloud blobs and concentric curved lines molded into the blue clay to represent sound waves. Dead center: Two prominent soft clay speech bubbles (one Blue, one Orange) oriented towards each other as if chatting. No borders, no vignette. Style: Plasticine texture with subtle fingerprint indentations, matte finish, soft daylight lighting, cute, friendly, no text. |
| **Wordle** | 3D Claymorphism scene in 16:9 landscape format. The entire image is a stylized clay "game board" environment—a matching horizontal clay surface with empty square indentations (slots) extending edge-to-edge. Dead center: A crisp row of 5 prominent soft clay square letter tiles (Green, Green, Yellow, Grey, Grey). No borders, no vignette. Style: Plasticine texture, matte finish, soft lighting, satisfying, tactile, no text. |

---

### B. Game Icons (Square)
**Dimensions:** 1:1 square (fits 56×56px containers)  
**Background:** Transparent (PNG)  
**Storage:** Supabase Storage → `game-assets/[game-name]-square.png`

**Base Prompt Template:**
```
3D Claymorphism icon, 1:1 square aspect ratio. [MAIN OBJECT DESCRIPTION]. Isolated object on a transparent background. Style: Plasticine texture, matte finish, soft lighting, cute, friendly, no text.
```

**Example Prompts:**

| Game | Prompt |
| :--- | :--- |
| **Memory Matrix** | 3D Claymorphism icon, 1:1 square aspect ratio. A soft clay 3x3 grid with rounded tiles, some glowing green, others white. Isolated object on a transparent background. Style: Plasticine texture, matte finish, soft lighting, cute, friendly, no text. |
| **Mental Arithmetic** | 3D Claymorphism icon, 1:1 square aspect ratio. A cute clay "+" and "−" symbol stacked together with a small clay number "3" floating nearby. Isolated object on a transparent background. Style: Plasticine texture, matte finish, bright primary colors, soft lighting, cute, friendly, no text. |
| **Language Discrimination** | 3D Claymorphism icon, 1:1 square aspect ratio. Two small soft clay speech bubbles (one blue, one orange) overlapping slightly. Isolated object on a transparent background. Style: Plasticine texture, matte finish, soft lighting, cute, friendly, no text. |
| **Wordle** | 3D Claymorphism icon, 1:1 square aspect ratio. Five small soft clay letter tiles in a row (Green, Green, Yellow, Grey, Grey). Isolated object on a transparent background. Style: Plasticine texture, matte finish, soft lighting, satisfying, tactile, no text on tiles. |

---

### C. Key Style Notes
- **Plasticine Texture**: Soft, slightly imperfect clay surfaces with subtle fingerprint impressions.
- **Matte Finish**: No glossy or shiny reflections.
- **Edge-to-Edge Scenes**: For thumbnails, the environment should fill the entire frame with no borders or vignettes.
- **Central Focus**: The main object should be dead center and prominent.
- **No Text**: All text/labels come from the UI, not the asset itself.
- **Export Formats**: Thumbnails as JPG, Icons as PNG (for transparency).

