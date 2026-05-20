# Dar Al Hai Design System

The frontend uses a shared blue enterprise dashboard system built from CSS tokens and small primitives.

## Tokens

Tokens live in `app/globals.css` under `:root`.

- `--color-canvas`: app background
- `--color-surface`, `--color-elevated`: panels and cards
- `--color-ink`, `--color-muted`: text hierarchy
- `--color-brand`: deep Dar Al Hai dashboard blue (`#245A99`)
- `--color-accent`: cyan/teal secondary accent (`#18C7C9`)
- `--color-success`, `--color-danger`, `--color-warning`: status colors
- `--radius-card`, `--radius-control`: standard radius values
- `--shadow-card`, `--shadow-control`, `--shadow-overlay`: elevation scale

## Primitives

Use the shared components before writing page-level UI:

- `Button`: primary, secondary, ghost, danger
- `Card`: page panels and grouped content
- `Badge`: neutral, yellow, green, red, dark
- `Field`: label + control wrapper
- `EmptyState`, `Skeleton`, `Toast`
- `SystemShell`: authenticated product shell and navigation

## CSS Utilities

Common CSS classes are also available:

- `ds-input`: input/select/textarea styling
- `ds-card`, `ds-card-subtle`: surfaces
- `ds-tab-list`, `ds-tab`, `ds-tab-active`: segmented controls
- `ds-brand-mark`: Dar Al Hai mark
- `ds-blue-header`, `ds-top-nav`, `ds-nav-link`: blue top navigation shell
- `ds-kpi-grid`, `ds-kpi-card`, `ds-icon-tile`, `ds-stat-pill`: dashboard KPI presentation
- `ds-session-chip`: profile/session element

## Page Rules

- Use the blue top-dashboard shell for authenticated product pages.
- Keep Dar Al Hai branding visible in the top navigation.
- Prefer white dashboard cards on `#F4F6FA` with subtle shadows and blue/cyan accents.
- Keep cards at `8px` radius or less.
- Use dense operational layouts for scheduling, reports, and machine tables.
- Avoid page-specific color systems unless the state is semantic.
- New pages should enter through `SystemShell` unless they are public auth or technician mobile screens.
