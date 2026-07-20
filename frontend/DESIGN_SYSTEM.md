# Dar Al Hai Design System

Dar Al Hai uses one restrained industrial design system across management, scheduling, technician work, EQP reports, machines, archives, modals, forms, and tables. It adapts the public Dar Al Hai Machinery identity to a compact operational application.

## Tokens

Tokens live in `app/globals.css`.

- Brand navy: `#16294D`
- Equipment yellow: `#F2A900`
- Heading ink: `#1D1D1D`
- Body gray: `#4A4E54`
- Background band: `#F4F4F4`
- Card background: `#FFFFFF`
- Link blue: `#1465B0`
- Border: `#D8D8D8`
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
- The sidebar is the only primary navigation.
- Cards use white surfaces on the light gray canvas with subtle elevation and a maximum `8px` radius.
- Forms use `ds-input` or the global form-control styling.
- Tables use the shared header, row, hover, and responsive overflow behavior.
- Buttons must use the shared `Button` component or `ds-button` classes for links.
- Status text should use `Badge` variants, never ad hoc colors.
- Keep layouts compact and data-rich; avoid decorative empty space.
- Primary commands are navy; yellow is reserved for equipment emphasis, selected states, and small brand signals.
