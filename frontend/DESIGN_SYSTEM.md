# Dar Al Hai Maintenance Design System

Dar Al Hai uses a cohesive, high-performance industrial design system across management, scheduling, technician work, EQP reports, machines, archives, modals, forms, and tables. It combines the operational prestige of machinery equipment with modern SaaS ergonomics.

## Tokens

Core tokens live in `app/globals.css`.

- **Brand Dark Navy / Slate**: `#0F172A` / `#1E293B`
- **Equipment Gold / Amber**: `#F59E0B` (Accent) & `#D97706` (Hover)
- **Canvas / Background**: `#F8FAFC`
- **Surface / Card Background**: `#FFFFFF`
- **Borders**: `#E2E8F0` / `#CBD5E1`
- **Text Ink**: `#0F172A` (Headings) & `#334155` (Body) & `#64748B` (Muted)
- **Semantic Tones**:
  - **Success / Live**: `#10B981` (soft: `#DCFCE7`)
  - **Warning / Pending**: `#F59E0B` (soft: `#FEF3C7`)
  - **Critical / Danger**: `#EF4444` (soft: `#FEE2E2`)
  - **Info / Ready**: `#0284C7` (soft: `#E0F2FE`)

## Radii & Elevation

- Card radius: `10px` (`--radius-card`)
- Control radius: `6px` (`--radius-control`)
- Badge radius: `9999px` (pill)
- Elevation: Subtle multi-layer shadows (`--shadow-card`, `--shadow-card-hover`, `--shadow-overlay`)

## Primitives

Use shared primitives across pages:

- `Button`: primary, secondary, ghost, danger, small, icon, full-width
- `Badge`: live, active, ready, preserved, pending, warning, critical, archived, completed
- `Card`: standard dashboard surface with subtle border and elevation
- `Field`: label, control, and validation helper wrapper
- `EmptyState`: icon container, title, description, and action button
- `Skeleton`: shimmering loading placeholder
- `Toast`: floating status alert
- `SystemShell`: unified sidebar navigation and glassmorphic topbar
- `DatesModal`, `ConfirmDialog`, `LoadingOverlay`: accessible, glassmorphic modal dialogs

## Page Rules

- Every authenticated desktop page enters through `SystemShell`.
- Field technicians use the dedicated mobile-optimized Arabic RTL layout (`/technician`).
- Use `Button` and `Badge` variants rather than ad-hoc colors.
- Maintain high contrast, legible typography, and clear visual hierarchy.
