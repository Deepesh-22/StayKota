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

Browser tests use `/usr/bin/chromium` when available. Otherwise install the Playwright browser with `npx playwright install chromium`. No database is required. The custom neighbourhood map runs locally and needs no map API, key, tiles or external requests.

## Experience

- **Landing:** custom isometric Kota illustration, accessible campus hotspots, synchronised search, a manually controlled hostel carousel and reduced-motion support.
- **Discovery:** campus and URL filters, available-room matching, inclusive monthly-cost budgets, AC-included filtering, sorting, pagination, custom coaching neighbourhood map and mobile list/map views.
- **Details:** photo gallery, illustrative room cutaway, room selection, fixed monthly costs, separate deposits, metered-charge explanation, actual room features and consent-based visit enquiries.
- **Comparison:** up to three published hostels, independent room selectors and shareable public listing/room IDs.
- **Student:** favourites, requested visits, preferred-date changes, cancellation and profile persistence.
- **Owner:** own listings and enquiries, five-step create/edit wizard, saved drafts and moderation submission.
- **Admin:** review queue, approval/rejection, reports and local moderation activity.

The custom map centres on a coaching campus and shows only matching approved hostels within the selected distance (default 1 km). Distance labels use Haversine calculations on sample coordinates; the illustrated drawing and connecting lines are not a surveyed street map or walking routes.

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
| `/map` | Custom coaching map, nearby hostel pins, local search and 2D/isometric 3D views |
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

React 19, TypeScript, Vite 6, Tailwind CSS 4, React Router 7 and Lucide. Fonts and compressed WebP sample photos are hosted locally. SVG illustrations and CSS provide landing-page motion without a 3D engine. The coaching map uses local SVG illustrations with accessible hostel buttons, pan/zoom and a 2D/isometric 3D switch. No map SDK is used.

- `src/components/home/`: campus scene and landing illustration.
- `src/components/hostel/`: cards, sample map and room cutaway.
- `src/pages/`: public pages and workspaces.
- `src/context/`: local prototype state and comparison.
- `src/data/`: sample inventory and campus coordinates.
- `src/lib/discovery.ts`: room prices, matching and distance helpers.
- `tests/`: unit and browser regression checks.

SPA rewrites for Vercel remain in `vercel.json`. Publishing or deployment is a separate step.

## Custom coaching neighbourhood map

Open `/map` and choose your coaching campus. Only approved hostels with matching available rooms within 1 km are shown; widen the radius to 3 or 5 km. The list and price pins use the same results, sorted by straight-line distance. Search filters nearby hostel names or localities without leaving the coaching neighbourhood. Select a pin to view the property summary and open its rooms.

Switch between **2D** and **3D**, an illustrated isometric scene with raised buildings. Both views retain the same hostel pins, selected property and filters. This is an intentionally simplified neighbourhood illustration, not satellite imagery, navigation or a reconstruction of Kota's buildings. Label positions are spread for readability; distances and eligibility come from coordinates rather than drawn connector lengths.

Drag the scene to pan or use zoom/reset buttons. The focusable map also accepts arrow keys and +/-; hostel pins are keyboard buttons. On mobile, Stays opens the accessible filter panel. The compact Explore map uses the same component and shows matching hostels within 1 km of the chosen campus, with a link to change the radius on `/map`.

Preview PNGs: [2D neighbourhood](docs/screenshots/coaching-map-2d.png) · [3D neighbourhood](docs/screenshots/coaching-map-3d.png).

The Google map, embedded fallback, satellite controls and Maps SDK have been removed. No API key, external tiles, billing account or Google network permission is needed. Tests cover proximity boundaries, missing coordinates, colocated labels, pin selection, campus changes, 2D/3D consistency, local search, empty results and mobile controls. Browser tests assert no external map-provider requests.

## Before real use

Replace simulated authentication and browser data with a backend that enforces roles, resource ownership, validation, rate limits and consent handling. Use actual reviewed inventory, photographs and campus coordinates. Configure real contact delivery, privacy/retention rules, backups, monitoring and public-page metadata/rendering before a live launch. A prototype admin role flag is not production authorization.

Real hostel coverage requires reviewed inventory and accurate coaching/property coordinates. Unlocated properties are excluded from the map rather than assigned invented locations.
