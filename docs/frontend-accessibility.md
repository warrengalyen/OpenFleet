# Frontend Accessibility

OpenFleet.Web targets WCAG 2.1 Level AA practices suitable for an enterprise operations console. Accessibility is built into shared components rather than addressed per page.

---

## Foundations

| Practice | Implementation |
|----------|----------------|
| Language | `<html lang="en">` in `index.html` |
| Page titles | `PageTitle` sets `document.title` (`{title} \| OpenFleet`) |
| Skip link | "Skip to main content" link in `AppLayout` (visible on focus) |
| Color contrast | Tailwind palette chosen for light and dark themes |
| Focus visibility | `focus-visible:ring-*` on interactive controls |
| Motion | No autoplay animations; loading uses subtle pulse skeletons |

---

## Semantic Structure

- One `<h1>` per page via `PageTitle`
- `<main>` wraps page content in `AppLayout`
- `<nav>` for sidebar navigation with `aria-expanded` on collapsible admin group
- `<header>` for the top bar
- Tables use `<table>`, `<thead>`, `<tbody>`, and `<th>` for column headers

---

## Forms

- `FormField` associates `<label>` with controls via `htmlFor`
- Required fields marked visually and with `required` attribute
- Validation errors surfaced inline with `role="alert"` where appropriate
- Login form has `aria-label="Sign in form"`
- Submit buttons set `aria-busy` while pending

---

## Feedback & States

| Component | ARIA |
|-----------|------|
| `EmptyState` | `role="status"`, `aria-label={title}` |
| `AsyncStatePanel` loading | `role="status"`, `aria-label={loadingLabel}` |
| `AsyncStatePanel` error | `role="alert"`, `aria-live="assertive"` |
| `QueryErrorBanner` | `role="alert"`, `aria-live="assertive"` |
| Login error | `role="alert"` |
| `ErrorBoundary` | `role="alert"`, `aria-live="assertive"` |

Screen-reader-only text (`sr-only`) accompanies icon-only loading spinners.

---

## Keyboard & Navigation

- All sidebar links are keyboard focusable `NavLink` elements
- Mobile sidebar closes on navigation (`onClose` passed to links)
- Sortable table headers are clickable and keyboard-activatable via native `<th>` focus (click handler)
- Dialogs (`Dialog`, `ConfirmDialog`) trap focus within the modal pattern
- Dark mode toggle and sign-out include `title` / visible text on larger breakpoints

---

## Icons

Decorative icons use `aria-hidden="true"` when adjacent text conveys meaning. Icon-only buttons (menu, close sidebar) include `aria-label`.

---

## Dark Mode

Theme preference is stored in `localStorage` and applied before React hydration to prevent flash. Both themes maintain readable contrast for text, borders, and status badges.

---

## Role-Based UI

Navigation items hidden by role are removed from the DOM (not merely styled invisible), so assistive technology does not announce unreachable destinations.

Unauthorized users are redirected to `/unauthorized` with a clear message including their current role label.

---

## Testing Accessibility

### Unit / component (vitest-axe)

Run the full unit suite — axe checks are included where components are tested:

```bash
cd src/OpenFleet.Web
npm run test
```

### E2E (Playwright + axe-core)

`@axe-core/playwright` is available for E2E accessibility scans. Extend E2E specs to call `injectAxe` and `checkA11y` on critical pages (login, dashboard, list views).

Example pattern:

```typescript
import { injectAxe, checkA11y } from 'axe-playwright'

test('dashboard has no critical a11y violations', async ({ page }) => {
  await page.goto('/dashboard')
  await injectAxe(page)
  await checkA11y(page)
})
```

---

## Checklist for New Pages

- [ ] Use `PageTitle` for the page heading and document title
- [ ] Provide `emptyTitle` / `emptyDescription` on `DataTable` when empty states matter
- [ ] Label all form fields; use `sr-only` labels for compact filter bars
- [ ] Show errors with `role="alert"` or `QueryErrorBanner`
- [ ] Ensure loading states are announced (`role="status"` or skeleton with `aria-busy`)
- [ ] Verify keyboard navigation through filters, tables, and actions
- [ ] Test in both light and dark mode

---

## Known Limitations

- Charts on the dashboard and reports are visual summaries without alternative data tables; screen reader users should use the underlying report pages or data tables where available.
- Some admin placeholder pages (department create/edit, settings) are informational until backend endpoints exist.
- Sortable columns rely on click; enhanced keyboard sort controls are a future improvement.
