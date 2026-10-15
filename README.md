# StayKota — Hostel Booking Frontend (Phase 1)

Polished, responsive hostel/PG discovery and visit-scheduling prototype for Kota, Rajasthan.

**Frontend only** · React + TypeScript + Vite + Tailwind CSS + React Router + Lucide

## Features

- **Visitor**: Browse & search approved hostels, view details, room types & transparent pricing
- **Student** (simulated login): Favourites, schedule visit (date only → Confirmed), visit history
- **Owner** (simulated login): Dashboard with listings status & visit requests
- **Admin** (private route): Moderate / approve / reject listings

## Business rules followed

- One hostel = one listing with multiple room types
- Rent, deposit, included services & extra charges shown separately
- Visit = date only; immediately Confirmed (frontend simulation)
- Clearly labelled demo content — no fake ratings or real messaging
- Only approved listings appear publicly

## Quick start

```bash
cd stay-kota
npm install
npm run dev
```

Open http://localhost:5173

### Demo accounts

| Role    | Email               |
|---------|---------------------|
| Student | aarav@student.com   |
| Owner   | priya@owner.com     |
| Admin   | admin@staykota.com  |

Any email works for the selected role (demo login).

## Project structure

```
src/
  components/
    ui/          → Button, Input, Select, Badge, Card
    layout/      → Navbar, Footer, Layout
    hostel/      → HostelCard, SearchFilters
  pages/         → Home, Detail, Login, Favourites, Visits, Owner, Admin, HowItWorks
  context/       → AppContext (auth + localStorage state)
  data/          → mockData
  types/         → TypeScript interfaces
```

## Design system

- Warm off-white (`#faf8f5`) backgrounds
- Deep teal primary (`#0d9488`)
- Dark navy accents
- Rounded cards, subtle borders, refined spacing
- Respects `prefers-reduced-motion`

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — preview build

## Notes

- All state persists in localStorage
- Mock data is easy to replace with real API later
- No backend, no real auth, no WhatsApp/email, no payments
