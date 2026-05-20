# EQP Design System

The frontend uses a shared operational design system built from CSS tokens and small primitives.

## Tokens

Tokens live in `app/globals.css` under `:root`.

- `--color-canvas`: app background
- `--color-surface`, `--color-elevated`: panels and cards
- `--color-ink`, `--color-muted`: text hierarchy
- `--color-brand`: primary Dar Al HAI action color
- `--color-accent`: secondary interaction and focus color
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
- `ds-brand-mark`: Dar Al HAI mark
- `ds-topbar`, `ds-session-chip`: shell elements

## Page Rules

- Prefer neutral surfaces with amber primary actions and teal focus/accent.
- Keep cards at `8px` radius or less.
- Use dense operational layouts for scheduling, reports, and machine tables.
- Avoid page-specific color systems unless the state is semantic.
- New pages should enter through `SystemShell` unless they are public auth or technician mobile screens.
