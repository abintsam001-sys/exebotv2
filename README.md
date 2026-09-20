# BUS WAVE — "Book. Board. Go."

A complete **demo** bus ticket booking website built with plain HTML5, CSS3 and vanilla JavaScript. No backend, no build step, no dependencies to install — it runs entirely in the browser and is ready for GitHub Pages.

⚠️ **This is a demo/portfolio project.** No real bus operators, no real payments. All data is fictional and all bookings are stored only in your browser's `localStorage`.

## Features

- Home page with animated hero, live search box (From/To/Date/Passengers + swap button), popular routes, popular cities, offers, "why choose us", reviews and FAQ
- Search results with filters (price, departure window, AC/Non-AC, seater/sleeper, rating) and sorting (recommended, price, departure, rating)
- Interactive seat selection (seater 2+2 layout and sleeper upper/lower deck layout) with live fare summary and a sticky mobile bar
- Passenger details form (per-seat) with validation, plus boarding/dropping point selection
- Checkout page with fare breakdown, coupon codes (`FIRSTBUS`, `WAVE100`, `WEEKEND`) and a **simulated** payment flow (UPI / Card / Net Banking)
- E-ticket / booking confirmation page with a generated QR code, download (print-to-PDF) and print support
- My Bookings page (Upcoming / Completed / Cancelled) backed by `localStorage`
- Demo Login / Register / Profile pages (`localStorage`-based — **not secure**, for demo only)
- Offers page listing all active coupon codes
- Help / FAQ page
- Admin dashboard (`/admin`) with KPIs, and full manage screens for Buses, Bookings, Users and Offers (add/edit/delete, all `localStorage`-backed)

## Running locally

Just open `index.html` in a browser, or serve the folder with any static server, e.g.:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploying to GitHub Pages

1. Create a new GitHub repository and push the contents of this folder to it (keep `index.html` at the repository root).
2. In the repository, go to **Settings → Pages**.
3. Under "Build and deployment", set **Source** to `Deploy from a branch`, choose your default branch and the `/ (root)` folder.
4. Save — GitHub will give you a URL like `https://<username>.github.io/<repo>/`.

All links in this project use relative paths, so it works correctly whether it's hosted at the root of a domain or in a subpath like `/repo-name/`.

## Project structure

```
/
├── index.html, search.html, seats.html, passenger.html, checkout.html,
│   ticket.html, bookings.html, login.html, register.html, profile.html,
│   offers.html, help.html
├── admin/
│   ├── index.html, buses.html, bookings.html, users.html, offers.html
├── css/
│   ├── style.css        (design tokens + all shared/page component styles)
│   ├── responsive.css   (mobile/tablet breakpoints)
│   └── admin.css        (admin dashboard styles)
├── js/
│   ├── data.js     (demo cities, buses, routes, offers, seat-map generator)
│   ├── app.js      (shared utilities: nav, toasts, storage helpers)
│   ├── search.js   (search results filtering & sorting)
│   ├── seats.js    (seat selection logic)
│   ├── booking.js  (passenger details, checkout, ticket, my bookings)
│   ├── auth.js     (demo login/register/profile)
│   └── admin.js    (admin dashboard logic)
└── assets/logo/favicon.svg
```

## Notes on data & storage

- Bus/route/offer data is generated deterministically in `js/data.js` (20+ demo buses across 14 Indian cities).
- `localStorage` keys used: `bw_bookings`, `bw_users`, `bw_current_user`, `bw_draft` (in-progress booking), `bw_admin_buses`, `bw_admin_offers`.
- Clearing your browser's site data will reset the demo to its original state.
