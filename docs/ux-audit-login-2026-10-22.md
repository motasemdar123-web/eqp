# Dar Al Hai Maintenance Management — UX/UI Audit (Login page)

Scope: `/` (UnifiedLogin), unauthenticated · local dev build (`next dev`, localhost:3000) ·
viewports 1440×900 and 375×812 · 2026-10-22

**Not covered:** all 28 authenticated routes (EQP, management, technician, media). Sign-in was
not completed during the audit, so no authenticated screen, no RTL/Arabic screen and no
cross-locale parity pass was run. Performance numbers were discarded because they reflect
first-compile `next dev`, not production.

Method: probe scripts for contrast, tap targets, naming, heuristics, perception, LTR and focus,
plus screenshots at both viewports and a source read of
[UnifiedLogin.js](../frontend/components/UnifiedLogin.js) and
[globals.css](../frontend/app/globals.css). Accessibility findings are judged against WCAG 2.2 AA.
There is no house design system in the repo to judge against.

## Summary

| Severity | Count |
|---|---|
| Critical | 2 |
| Major | 3 |
| Accessibility | 3 |
| Note | 1 |

The page is small and mostly sound in structure: one font family, four corner radii, no tap
target under 24px, and no horizontal scroll at 375px. The two critical findings share **one root
cause in `globals.css`** that almost certainly reaches beyond this page, which is the main reason
to read this report.

## Findings

### 01 · Critical · app-wide (found on `/`)
**Unlayered base rules in `globals.css` override Tailwind utilities on every heading, button and input.**

Tailwind v4 emits utilities inside `@layer utilities`. Unlayered CSS always beats layered CSS,
whatever the specificity. [globals.css:120](../frontend/app/globals.css:120) sets `color` and
`font-weight` on `h1…h6`, and [globals.css:128](../frontend/app/globals.css:128) sets `font: inherit`
on `button, input, select, textarea`. That means `text-white`, `font-extrabold`, `text-xs`,
`font-bold` and similar utilities on those elements are silently ignored everywhere in the app.
Each screen then looks "almost right", which is why this has survived.

```
<h1 class="… font-extrabold … text-white">   computed: color rgb(15,23,42), weight 600
<button class="… text-xs font-bold">          computed: 14px, weight 400   (Direct Sign-in, Microsoft SSO, Sign In)
```

FIX: wrap the element rules in `@layer base { … }`. They keep their role as defaults, and
utilities win again. After the change, re-check headings app-wide, because some screens may have
been visually tuned around the bug.

### 02 · Critical · `/`
**The login headline is effectively invisible: 1.13:1 contrast.**

This is the largest text on the page and the first thing a user should read. A direct consequence
of 01. It fails WCAG 1.4.3, and it reads as a rendering glitch to anyone who notices the faint
shape.

```
"Service & Fleet Operations"  32px/600  rgb(15,23,42) on rgb(2,6,24)  → 1.13:1 (needs 3:1)
UnifiedLogin.js:78  className="… text-white …"
```

FIX: resolved by 01. No change is needed in the component.

STATUS (2026-10-22): 01 applied. Re-measured after the change: `rgb(255,255,255)` at weight 800,
contrast 20.75:1. Buttons now render the classes' 12px/700 instead of 14px/400.

### 03 · Major · `/` at 375×812
**On a phone, the Sign In button is below the fold.**

The brand panel stacks above the form and takes the first ~530px. The one task on this page needs
a scroll before the user can finish it.

```
viewport height 812
h2 "Sign in to Dar Al Hai"  y 551–579
email input                  y 710–754
password input               y 790–833   (partly below fold)
Sign In button               y 849–895   (fully below fold)
```

FIX: below `lg`, reduce the brand panel to the logo and wordmark: hide the description and the
PARTS/FLEET/EQP tiles (`hidden lg:grid`). Alternatively, render the form first with
`order-first lg:order-none`.

### 04 · Major · `/`
**The email placeholder shows a real employee's address.**

`mohammad.qraein@daralhai.com` is a seeded user with the WAREHOUSE_OFFICER role
([seed.js:177](../backend/prisma/seed.js:177)). Shown on an unauthenticated page, it gives every
visitor a valid account name to aim at, and it reads as someone's personal data rather than an
example.

```
UnifiedLogin.js:153  placeholder="e.g. mohammad.qraein@daralhai.com"
```

FIX: use `name@daralhai.com`.

### 05 · Major · `/` at 375×812
**The email placeholder is clipped on mobile.**

```
placeholder text width 251px  vs  input content box 248px  (14px Inter)
```

FIX: fixed for free by the shorter placeholder in 04.

### 06 · Accessibility · `/`
**The email and password fields have no accessible name. Fails WCAG 4.1.2 and 1.3.1.**

The visible `<label>`s are not linked to their inputs, so screen readers announce "edit text,
required" with no name. Password managers also lose their best signal.

```
label "Organization Email"  htmlFor=""  input id=null  autocomplete=null
label "Password"            htmlFor=""  input id=null  autocomplete=null
```

FIX: add `id`/`htmlFor` pairs (UnifiedLogin.js:149, 161), plus `autoComplete="username"` and
`autoComplete="current-password"`.

### 07 · Accessibility · `/`
**Small text fails contrast. WCAG 1.4.3 needs 4.5:1.**

```
"Protected by Role-Based Access Control (RBAC)."  11px  slate-400 on white   2.63:1
"ENTERPRISE ACCESS"                               12px  amber-600 on white   3.20:1
"Microsoft SSO" (inactive tab)                    14px  slate-500 on slate-100  4.35:1
```

FIX: slate-400 → slate-500 (≈4.6:1 on white), amber-600 → amber-700, and inactive tab text
slate-500 → slate-600.

### 08 · Accessibility · `/`
**The sign-in method toggle exposes no state. Fails WCAG 4.1.2.**

"Direct Sign-in" and "Microsoft SSO" are two plain buttons. Which one is active is shown only by
a white background.

```
role=null  aria-pressed=null  aria-selected=null   (both buttons)
```

FIX: add `aria-pressed={authMode === 'direct'}` (and the same for the other button).
Alternatively, use `role="tablist"`/`role="tab"`/`aria-selected`.

### 09 · Note · `/`
**The focus indicators on the inputs and the Sign In button are likely too faint. Not verified live.**

These controls set `focus:outline-none` and replace it with `ring-2 ring-amber-500/20` (inputs) or
`ring-4 ring-amber-500/20` (button). Calculated from Tailwind's default amber-500, a 20% amber
ring on white is about 1.2:1, against the 3:1 that WCAG 1.4.11 / 2.4.11 requires. On the inputs,
the 1px amber border change (≈2.1:1) is the only other cue. I measured the toggle buttons live
(browser default ring, 4.35:1, passes) but did not tab into these fields, so treat this as a lead,
not a measurement.

FIX: use `focus-visible:ring-2 focus-visible:ring-amber-600` at full opacity, with
`ring-offset-2`.

## What works

- **Tap targets:** 5 of 5 are ≥ 24px (WCAG 2.5.8). 4 of those are between 24 and 44px, and the
  primary submit is 46px tall at full width.
- **No horizontal overflow at 375px.** The decorative glow is clipped by `overflow-hidden` as
  intended.
- **Tight design tokens:** 1 font family (Inter), 4 border radii, 11 spacing values,
  304 custom-property uses.
- **Toggle-button focus:** the browser default ring measures 4.35:1 against slate-100, which
  passes SC 1.4.11.
- **Copy:** consistent Title Case, helper text punctuated consistently, no placeholder or lorem
  text, and a meta description is present.
- Low choice load: 5 interactive targets on the first screen (Hick index 2.58), with one obvious
  task.

## Where to start (impact ÷ effort)

1. **01** — wrap two rule blocks in `@layer base`. It is a one-line change, fixes 02, and very
   likely fixes typography app-wide.
2. **04 + 05** — change one placeholder string.
3. **06** — add four attributes.
4. **07, 08** — class swaps and `aria-pressed`.
5. **03** — responsive rework of the brand panel.
6. **09** — verify with a real Tab keypress, then tighten the ring.

## Next audit

Run the authenticated pass (all 28 routes, the technician screens at 375px, and the RTL pass on
technician/toolbox/media) once a test account is available. Re-check headings across the app after
fix 01 lands.
