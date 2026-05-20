# Dar Al Hai Design System

Dar Al Hai uses one enterprise command-center design system across management, scheduling, technician work, EQP reports, machines, archives, modals, forms, and tables.

## Tokens

Tokens live in `app/globals.css`.

- Primary blue: `#1F5B99`
- Dark blue: `#123B66`
- Deep navy: `#071B33`
- Accent cyan: `#18C7C9`
- Background: `#F4F7FB`
- Card background: `#FFFFFF`
- Soft panel: `#EEF4FB`
- Border: `#DDE7F2`
- Text primary: `#071B33`
- Text secondary: `#64748B`
- Success, warning, danger, and info use the semantic token set.

## Primitives

Use shared primitives before page-level markup:

- `Button`: primary, secondary, ghost, danger, small, icon, full-width
- `Badge`: live, active, ready, preserved, pending, warning, critical, archived, completed
- `Card`: standard dashboard surface
- `Field`: label and form control wrapper
- `EmptyState`, `Skeleton`, `Toast`
- `SystemShell`: authenticated top navigation and blue command header

## CSS Utilities

- `ds-card`, `ds-card-hover`
- `ds-button`, `ds-button-*`
- `ds-input`
- `ds-kpi-grid`, `ds-kpi-card`, `ds-icon-tile`, `ds-stat-pill`
- `ds-analytics-grid`, `ds-module-grid`, `ds-module-card`
- `ds-donut`, `ds-chart-row`, `ds-chart-bar`, `ds-chart-fill`
- `ds-table`, `ds-table-wrap`
- `ds-activity-item`, `ds-activity-dot`

## Page Rules

- Every authenticated page enters through `SystemShell`.
- The top navigation is the only primary navigation.
- Cards use white surfaces on the blue-gray canvas with subtle elevation.
- Forms use `ds-input` or the global form-control styling.
- Tables use the shared header, row, hover, and responsive overflow behavior.
- Buttons must use the shared `Button` component or `ds-button` classes for links.
- Status text should use `Badge` variants, never ad hoc colors.
- Keep layouts compact and data-rich; avoid decorative empty space.
