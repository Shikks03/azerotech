# TRACKER.md

Track new features, bugs, and problems for the AzeroTech project.

**Status labels:** `Todo` · `In Progress` · `Done` · `Blocked`

---

## Completed Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | Backend / Database integration | Replaced all `localStorage` usage with MongoDB Atlas. Appointments and reservations are saved via Next.js API routes (`/api/appointments`, `/api/reservations`) and persisted in the cloud database. |
| 2 | Admin dashboard | Password-protected internal page (`/admin`) for the shop owner to view and manage appointments and reservations. Includes status dropdowns (Pending → Confirmed → Completed → Cancelled) and a live refresh button. |
| 3 | Inventory management | Admin Inventory tab showing all products with live stock counts. Supports +/− buttons, manual input, and quick-set shortcuts (5 / 10 / 20). Stock updates are saved to MongoDB via `PATCH /api/products/[id]`. Products show a zero-padded ID badge (e.g. `#001`). |
| 7 | Product CRUD from admin panel | Admin can add new products (name, category, price, image URL, initial stock) via "Add Product" modal, edit existing product info via "Edit Info" button, and remove products via a two-step "Remove → Confirm" inline flow. API: `POST /api/products`, `DELETE /api/products/[id]`. |
| 4 | Out-of-stock display | Accessories page reads `stock` from MongoDB. Products with 0 stock show a greyscale image with an "Out of Stock" overlay and a disabled Reserve button. |
| 5 | Product list connected to MongoDB | Accessories product grid is fetched from `/api/products` (MongoDB) instead of a hardcoded array. Categories are derived dynamically from the database. Includes animated skeleton loaders while fetching. |
| 6 | Skeleton loaders for accessories | Animated placeholder cards shown while product data loads from the database instead of a blank grid. |
| 8 | Admin loading state | Spinner + "Fetching data…" screen shown while the admin panel is loading appointments, reservations, and products from the database. |
| 9 | Admin appointment search by name | Appointment search bar now matches against both Appointment ID and customer name. |
| 10 | Appointment number generation | Unique appointment IDs (format: `AZT-YYYYMMDD-XXXX`) are generated on booking submission, displayed on the confirmation screen, and used by the admin dashboard for lookup. |
| 15 | LCD Stock table refactor | Replaced card grid with structured table. Extended schema: `phone_brand`, `lcd_brand`, `compatible_models[]`, `anna_price`, `marlon_price`. Stats bar, search (brand + models), sort, and inline stock controls. All code review issues resolved; manual verification passed 2026-04-03. |

---

## Upcoming Features

| # | Feature | Source | Description | Priority |
|---|---------|--------|-------------|----------|
| 1 | Repair Status Checker | Spec | Page where customers enter their phone number or repair receipt number and see their repair stage: Device Received → Waiting for Parts → Fixing → Ready for Pickup. | High |
| 2 | Disable/hide booked time slots | Spec | Pull booked appointment slots from DB and mark them as unavailable in the booking form so customers can't double-book. | High |
| 3 | Repair tracking panel for staff | Spec | Staff-facing UI to update repair status stages so customers see live progress via the Repair Status Checker. | Medium |
| 5 | Customer repair history | Spec | Allow returning customers to look up past repairs by phone number. | Low |
| 6 | Multi-branch management | Spec | Support for a second shop location — add it to the map embed and let customers choose a branch when booking. | Low |
| 7 | FAQ section | Suggestion | Collapsible FAQ on the Services or Home page answering common questions (repair time, warranty, price range). Reduces repetitive customer messages. | Medium |
| 8 | Customer reviews / testimonials | Suggestion | Static or dynamic testimonials section on the homepage to build trust with new visitors. | Medium |
| 9 | Print / save appointment confirmation | Suggestion | After a successful booking, let customers download or print a simple confirmation slip with their booking details. | Medium |
| 10 | Custom 404 error page | Suggestion | Branded not-found page matching the site design instead of the default Next.js error page. | Low |
| 11 | SEO & Open Graph setup | Suggestion | Add page-level `<title>`, `<meta description>`, and Open Graph tags so the site looks good when shared on social media and ranks better in search. | Medium |
| 12 | Product visibility toggle (Active/Hidden) | Suggestion | Add an `active` boolean field to products. Admin can toggle a product as hidden without deleting it — hidden products don't appear on the public accessories page. Useful for seasonal or temporarily unavailable items. | Medium |
| 13 | Inventory search & category filter | Suggestion | Add a search box and category dropdown to the admin Inventory tab so staff can quickly find products in a large catalog. | Low |
| 14 | Low-stock threshold alert | Suggestion | Allow admin to set a per-product low-stock threshold. Items below the threshold show a distinct warning badge and are surfaced at the top of the inventory grid. | Low |

---

## Bugs

| # | Bug | Description | Status |
|---|-----|-------------|--------|
| 1 | Header nav text invisible on scroll | Nav link text is black and becomes invisible against the dark background when the user scrolls down | `Done` |
| 2 | Logo and title overlap on small screens | "AzeroTech" title text overlaps with the logo in portrait/small screen orientations due to insufficient spacing | `Todo` |
| 3 | Admin panel hydration mismatch | `isAuthenticated` was initialized using `typeof window !== "undefined"` causing server/client HTML mismatch. Fixed by always starting with `false` and reading `sessionStorage` in a `useEffect`. | `Done` |
| 4 | Delete button in edit modal doesn't delete from DB | The delete button inside the Appointment and Reservation edit modals removes the entry from local UI state but the `DELETE /api/appointments/[id]` and `DELETE /api/reservations/[id]` API routes are not implemented, so the record is not actually removed from MongoDB. | `Done` |

---

## Problems / Issues

| # | Problem | Description | Status |
|---|---------|-------------|--------|
| 1 | Security vulnerability audit | Full pentest (Sessions 1–11). All C/H/M/L findings fixed. CSP uses `unsafe-inline` (nonce-based reverted — Next.js hydration failure). Admin password must be changed before external access. | `Done` |
| 2 | Merge review fixes (feature/api-auth → master) | Pre-merge code review found 14 issues — all 14 fixed. `feature/api-auth` merged to `master` on 2026-03-28. 3 post-merge regressions hotfixed same day. | `Done` |
