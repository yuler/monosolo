# Design System

MonoSolo design system: minimalist black-and-white theme with strict square corners (Scheme A).

UI copy defaults to Chinese. Code, tokens, typography, and component names use English.

## Principles

- **Black-and-white minimalism**: Colors are reduced to pure black and white. Dividers use 1px solid lines, with a minimal neutral gray scale rather than an expansive full palette or colored accents.
- **Symmetric inversion**: Dark and light modes share the same semantic token names, merely inverting background and text colors.
- **Strict square radius**: All corners use strict square edges (`border-radius: 0`); rounded corners are eliminated across the system.
- **Accessible contrast**: Muted gray text satisfies WCAG AA contrast requirements (body text contrast ≥ 4.5:1).

---

## Color Tokens

The color palette is streamlined to 7 foundational semantic tokens, plus an auxiliary status color (`destructive`):

| Token       | Dark      | Light     | Usage                                                  |
| :---------- | :-------- | :-------- | :----------------------------------------------------- |
| `ground`    | `#000000` | `#ffffff` | Global page background                                 |
| `ink`       | `#ffffff` | `#000000` | Primary body text, headings, emphasized borders        |
| `gray`      | `#888888` | `#666666` | Secondary text, meta, descriptive copy (WCAG AA)       |
| `line`      | `#333333` | `#e5e5e5` | Hairline dividers, card borders, input borders         |
| `wash`      | `#111111` | `#f2f2f2` | Recessed background, secondary container, hover states |
| `solid`     | `#ffffff` | `#000000` | Solid button background, active highlight background   |
| `solid-ink` | `#000000` | `#ffffff` | Solid button label color, active highlight foreground  |

> [!NOTE]
> In light mode, `gray` is set to `#666666`, providing a contrast ratio > 5:1 on both `#ffffff` and `#f2f2f2` backgrounds to satisfy WCAG AA contrast standards.

---

## Strict Square Radius

All component corners are strictly square without rounded borders:

- Global `--radius` is set to `0`, and derived tokens (`--radius-sm` through `--radius-4xl`) all compute to `0`.
- Enforce strict square corners globally across all elements and pseudo-elements:
  ```css
  :where(*):not([data-rounded], [data-rounded] *),
  :where(*):not([data-rounded], [data-rounded] *)::before,
  :where(*):not([data-rounded], [data-rounded] *)::after {
    border-radius: 0 !important;
  }
  ```
- Rare exceptions that require rounded shapes (such as blinking indicator dots or status beacons) explicitly opt out via the `data-rounded` attribute.

---

## Web Frontend Token Architecture (Tailwind v4)

Structured into three layers in `apps/web/src/styles.css`:

### 1. Raw Value Layer (`:root` and `.dark`)
Defines raw unlayered variables with a `--k41-` prefix to avoid conflicts with third-party or component-scoped variables:
```css
:root {
  --k41-ground: #ffffff;
  --k41-ink: #000000;
  --k41-gray: #666666;
  --k41-line: #e5e5e5;
  --k41-wash: #f2f2f2;
  --k41-solid: #000000;
  --k41-solid-ink: #ffffff;
  ...
}
```

### 2. Tailwind v4 Theme Mapping (`@theme inline`)
Maps utility classes to underlying raw tokens (e.g. `--color-ground: var(--k41-ground)`), completely eliminating self-referencing cyclic `var()` risks in CSS cascade layers:
```css
@theme inline {
  --color-ground: var(--k41-ground);
  --color-ink: var(--k41-ink);
  --color-gray: var(--k41-gray);
  --color-line: var(--k41-line);
  --color-wash: var(--k41-wash);
  --color-solid: var(--k41-solid);
  --color-solid-ink: var(--k41-solid-ink);

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-border: var(--border);
}
```

### 3. Component Semantic Alignment Layer (shadcn / Base UI)
Keeps existing UI components working seamlessly by mapping common semantic tokens to the black-and-white theme:
- `--primary`: mapped to `var(--k41-solid)`
- `--primary-foreground`: mapped to `var(--k41-solid-ink)`
- `--background`: mapped to `var(--k41-ground)`
- `--foreground`: mapped to `var(--k41-ink)`
- `--border` / `--input`: mapped to `var(--k41-line)`
- `--muted` / `--secondary` / `--accent`: mapped to `var(--k41-wash)`
- `--muted-foreground`: mapped to `var(--k41-gray)`
- `--card` / `--popover` / `--sidebar`: mapped to `var(--k41-ground)`

---

## Component Guidelines

### 1. Button
- **Solid Button (`ButtonSolid` / `default`)**: `solid` fill, `solid-ink` text, 1px `solid` border, strictly square.
- **Ghost / Outline Button (`ButtonGhost` / `outline`)**: Transparent or `ground` fill, `ink` text, 1px `line` border, hover `wash` background.
- **Disabled State**: Opacity reduced to 50%, pointer events disabled.

### 2. Card & Containers
- `ground` background, 1px `line` border, strictly square.
- Avoid large drop shadows and gradients; rely on 1px `line` borders for hierarchy.

### 3. Input & Form Controls
- `ground` background, 1px `line` border, `ink` text.
- Focus outline uses 1px `solid`, strictly square.
- Mobile font size defaults to no less than 16px to prevent iOS Safari auto-zoom on focus.

### 4. Theme Wipe
- Theme toggles trigger native circular expansion masks driven by View Transitions.
- Gracefully falls back without animation if the browser lacks support or if `prefers-reduced-motion` is enabled.
