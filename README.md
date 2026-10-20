# StayKota

A responsive, interactive hostel-discovery frontend for students moving to Kota. Choose a coaching campus, explore available room options, compare monthly costs, and save a visit enquiry.

**This is a frontend prototype.** Property photography is AI-generated illustration; listings, campus coordinates, prices and availability are sample data. Authentication, roles, moderation and requests operate in browser storage. No real SMS, owner notification, booking, payment or WhatsApp message is sent.

## Development

Tested with Node.js 24 and npm 11.

```sh
npm ci
npm run dev
```

Vite normally listens on port 5173. For an externally reachable development server, pass `-- --host 0.0.0.0`.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run preview` | Inspect the production build |
| `npm run typecheck` | TypeScript project checks |
| `npm run lint` | Oxlint |
| `npm test` | Room matching, cost calculation and distance unit tests |
| `npm run test:e2e` | Chromium browser tests; starts its own development server |

Browser tests use `/usr/bin/chromium` when available. Otherwise install the Playwright browser with `npx playwright install chromium`. No database, API credentials or external map service is required for this preview.

## Experience

- **Landing:** custom isometric Kota illustration, accessible campus hotspots, synchronised search, a manually controlled hostel carousel and reduced-motion support.
- **Discovery:** campus and URL filters, available-room matching, inclusive monthly-cost budgets, AC-included filtering, sorting, pagination, schematic map and mobile list/map views.
- **Details:** photo gallery, illustrative room cutaway, room selection, fixed monthly costs, separate deposits, metered-charge explanation, actual room features and consent-based visit enquiries.
- **Comparison:** up to three published hostels, independent room selectors and shareable public listing/room IDs.
- **Student:** favourites, requested visits, preferred-date changes, cancellation and profile persistence.
- **Owner:** own listings and enquiries, five-step create/edit wizard, saved drafts and moderation submission.
- **Admin:** review queue, approval/rejection, reports and local moderation activity.

The map is schematic. Distance labels use Haversine calculations on sample coordinates; they do not represent walking routes, travel times or surveyed locations.

A matching available room must satisfy sharing, budget and room-specific AC requirements together. Card prices include mandatory monthly extras; deposits and optional or metered charges remain separate. Visit requests start as `requested` / coordination pending, never automatically confirmed.

## Demo accounts

On `/login`, select Student or Owner and choose **Use sample account** to explore seeded content. Admin is available only through `/login?role=admin`; there is no public admin signup.

Alternatively enter any ten-digit mobile number, then `4242` or any four digits. This is explicitly simulated authentication. Seed email identities are `aarav@student.com`, `priya@owner.com`, and `admin@staykota.com`.

Browser storage keeps this device's demo session, listings, favourites, comparison and requests. It does not synchronise across devices or provide production security. Use sample personal information.

## Routes

| Route | Page |
| --- | --- |
| `/` | Landing and campus search |
| `/explore` | Search results and map |
| `/hostel/:id` | Room details and visit flow |
| `/compare` | Shared shortlist comparison |
| `/login` | Demo sign-in |
| `/dashboard` | Student overview, saved hostels, visits and profile |
| `/favourites`, `/visits` | Redirects to the matching dashboard tab |
| `/owner` | Owner workspace |
| `/owner/listing/new`, `/owner/listing/:id/edit` | Listing wizard |
| `/admin` | Demo moderation workspace |
| `/how-it-works` | Help and FAQ |
| `*` | Recovery/404 |

## Stack and structure

React 19, TypeScript, Vite 6, Tailwind CSS 4, React Router 7 and Lucide. Fonts and compressed WebP sample photos are hosted locally. SVG illustrations and CSS provide motion without a 3D engine or map API dependency.

- `src/components/home/`: campus scene and landing illustration.
- `src/components/hostel/`: cards, sample map and room cutaway.
- `src/pages/`: public pages and workspaces.
- `src/context/`: local prototype state and comparison.
- `src/data/`: sample inventory and campus coordinates.
- `src/lib/discovery.ts`: room prices, matching and distance helpers.
- `tests/`: unit and browser regression checks.

SPA rewrites for Vercel remain in `vercel.json`. Publishing or deployment is a separate step.

## Before real use

Replace simulated authentication and browser data with a backend that enforces roles, resource ownership, validation, rate limits and consent handling. Use actual reviewed inventory, photographs and campus coordinates. Configure real contact delivery, privacy/retention rules, backups, monitoring and public-page metadata/rendering before a live launch. A prototype admin role flag is not production authorization.
