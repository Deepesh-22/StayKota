# StayKota — Hostel Booking Frontend (Phase 1)

Polished, responsive hostel & PG discovery + visit-scheduling prototype for students in **Kota, Rajasthan**.

**Scope:** Frontend only. No real backend, authentication, email, WhatsApp, or payments.

**Stack:** React 19 · TypeScript · Vite 6 · Tailwind CSS 4 · React Router 7 · Lucide icons

---

## Features

| Role | Capabilities |
|------|----------------|
| **Visitor** | Browse/search approved hostels, view details, transparent room pricing |
| **Student** | Demo login, favourites, date-only visit requests (auto-Confirmed), dashboard |
| **Owner** | Demo login, listing CRUD wizard, draft/pending/live status, visit list |
| **Admin** | Private route, moderation queue (approve/reject/suspend), reports (demo) |

### Business rules enforced in UI

- Visits are **date-only** — no time picker
- Valid visit submission is immediately **Confirmed** (no owner-approval queue)
- A visit is **not** a room reservation or payment
- New/edited owner listings go to **Pending Review** until admin approves
- Only **approved** listings appear on public Explore/Home
- No public Admin signup (`/login?role=admin` is demo-only)

---

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript project references check |
| `npm run preview` | Preview production build |

### Demo login

1. Go to `/login`
2. Choose **Student** / **Owner** (Admin: `/login?role=admin`)
3. Enter any 10-digit mobile number
4. OTP **4242** (or any 4 digits) — **no real SMS**

Optional seed emails: `aarav@student.com`, `priya@owner.com`, `admin@staykota.com`

---

## Routes

| Path | Page |
|------|------|
| `/` | Home / search hero |
| `/explore` | Search results + filters |
| `/hostel/:id` | Hostel details + visit flow |
| `/login` | Role tabs + demo OTP |
| `/dashboard` | Student dashboard (overview, saved, visits, profile) |
| `/favourites` | Favourites (legacy alias) |
| `/visits` | Visits (legacy alias) |
| `/owner` | Owner dashboard |
| `/owner/listing/new` | Create listing wizard |
| `/owner/listing/:id/edit` | Edit listing wizard |
| `/admin` | Admin moderation (private) |
| `/how-it-works` | Help / about |
| `*` | 404 |

---

## Folder structure

```
src/
  components/
    ui/           Button, Input, Select, Badge, Card
    layout/       Navbar, Footer, Layout
    hostel/       HostelCard, SearchFilters
  pages/          All route screens
  context/        AppContext — shared mock state + localStorage
  services/       mockApi.ts — async mock service layer (swap for Go APIs in Phase 2)
  data/           mockData.ts — seed hostels, users, localities, amenities
  types/          Hostel, RoomType, User, VisitRequest, ListingStatus, …
  index.css       Design tokens + Tailwind
```

---

## Design system

- Background: warm off-white `#faf8f5`
- Primary: deep teal (`teal-600` / `#0d9488`)
- Accents: dark navy / slate
- Cards: rounded-2xl, light borders, soft shadows
- Motion: `animate-fade-in`, card hovers; respects `prefers-reduced-motion`

---

## State & mock API

- **AppContext** holds user, hostels, favourites, visits
- Persisted keys: `staykota_user`, `staykota_hostels`, `staykota_favourites`, `staykota_visits`
- **`src/services/mockApi.ts`** mirrors future REST endpoints (`getHostels`, `createVisit`, `setHostelStatus`, …)
- Phase 2: replace mockApi bodies with `fetch` to Go + PostgreSQL; keep function signatures

---

## Prototype limitations

- Demo OTP / Google button — **not secure auth**
- No real SMS, email, WhatsApp, or payment
- Image “upload” uses sample Unsplash URLs
- Admin access is a frontend role flag only
- Data lives in the browser `localStorage` of each device

---

## Deploy

Configured for Vercel SPA rewrites (`vercel.json`).

```bash
npm run build
```

Production: [https://stay-kota.vercel.app](https://stay-kota.vercel.app)

---

## Phase 2 (out of scope)

Go REST API · PostgreSQL · real JWT auth · moderation notifications · file uploads · WhatsApp/email
