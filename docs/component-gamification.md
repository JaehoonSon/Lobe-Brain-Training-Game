# Juicy / Gamified Design System Guidelines

We are implementing a **"Flat 3D" (Juicy)** aesthetic similar to Duolingo.
Use these instructions to update UI components.

## Core Philosophy

- **Tactile**: Elements should look like physical objects with thickness.
- **Round**: Avoid sharp corners. Use large border radii.
- **Chunky**: Use thick borders (`2px`) instead of hairlines.

## Technical Implementation (Tailwind / NativeWind)

### 1. Global Variables (Already Configured)

We have configured specific colors for the "3D Edge" (the dark side of the button/card):

- `--primary` / `--primary-edge`
- `--secondary` / `--secondary-edge`
- (And so on for accent, destructive, etc.)

### 2. Styling Rules

#### **Cards & Containers**

Instead of drop shadows (`shadow-sm`, `shadow-md`), use **Solid Borders**:

- **Border Width**: `border-2` (for the outline).
- **Bottom Border**: `border-b-4` (creates the depth/thickness).
- **Radius**: `rounded-xl` (12px) or `rounded-2xl` (16px).
- **Code Example**:
  ```tsx
  className = "rounded-xl border-2 border-border border-b-4 bg-card";
  ```

#### **Inputs & Form Elements**

Make them feel substantial:

- **Height**: `h-12` or `h-14` (Standard is usually h-10).
- **Border**: `border-2` (Thick, solid).
- **Radius**: `rounded-xl`.
- **Focus State**: High contrast ring or border color change.

#### **Buttons (Already Implemented)**

_Reference logic for new buttons:_

- **Normal**: `border-b-4 border-primary-edge`
- **Active (Pressed)**: `active:border-b-0 active:translate-y-1`
- This makes the button physically "press" down.

#### **Modals (Dialogs, Popovers)**

- Match the **Card** styling.
- Ensure they have the `border-b-4` thickness to pop out from the background.

## Checklist for AI Agent

- [ ] Update **Card** component (`components/ui/card.tsx`)
- [ ] Update **Input** component (`components/ui/input.tsx`)
- [ ] Update **Dialog/Modal** overlays
- [ ] Ensure **Text** is not too small (bump `text-sm` to `text-base` where appropriate)
