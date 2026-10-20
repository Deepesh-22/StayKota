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

Browser tests use `/usr/bin/chromium` when available. Otherwise install the Playwright browser with `npx playwright install chromium`. No database is required. The Google city map needs Internet access; custom StayKota pins additionally use the optional browser key described below.

## Experience

- **Landing:** custom isometric Kota illustration, accessible campus hotspots, synchronised search, a manually controlled hostel carousel and reduced-motion support.
- **Discovery:** campus and URL filters, available-room matching, inclusive monthly-cost budgets, AC-included filtering, sorting, pagination, Google city map and mobile list/map views.
- **Details:** photo gallery, illustrative room cutaway, room selection, fixed monthly costs, separate deposits, metered-charge explanation, actual room features and consent-based visit enquiries.
- **Comparison:** up to three published hostels, independent room selectors and shareable public listing/room IDs.
- **Student:** favourites, requested visits, preferred-date changes, cancellation and profile persistence.
- **Owner:** own listings and enquiries, five-step create/edit wizard, saved drafts and moderation submission.
- **Admin:** review queue, approval/rejection, reports and local moderation activity.

The city basemap is supplied by Google Maps and opens at a city-wide Kota view. Hostel and campus pins still use illustrative coordinates. Distance labels use Haversine calculations on those sample coordinates; they do not represent walking routes, travel times or surveyed locations.

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
| `/map` | Full-city Google map, place search, road/satellite view and hostel panel |
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

React 19, TypeScript, Vite 6, Tailwind CSS 4, React Router 7 and Lucide. Fonts and compressed WebP sample photos are hosted locally. SVG illustrations and CSS provide landing-page motion without a 3D engine. Google Maps supplies the real city basemap; its optional JavaScript integration is loaded separately only when a browser API key is configured.

- `src/components/home/`: campus scene and landing illustration.
- `src/components/hostel/`: cards, sample map and room cutaway.
- `src/pages/`: public pages and workspaces.
- `src/context/`: local prototype state and comparison.
- `src/data/`: sample inventory and campus coordinates.
- `src/lib/discovery.ts`: room prices, matching and distance helpers.
- `tests/`: unit and browser regression checks.

SPA rewrites for Vercel remain in `vercel.json`. Publishing or deployment is a separate step.

## Whole-city Google map

Open `/map` or select **Explore Kota** in the navigation. The city view starts at Kota (25.183, 75.839), zoom 12, and can be panned or zoomed freely. Search an area, road or landmark, switch Map/Satellite imagery independently of 2D/3D tilt, choose a campus, centre a sample hostel, or reset to **Whole Kota**. On mobile, **Stays** opens the filter/list panel. Select a coaching campus to sort stays nearest first and optionally filter within 1, 3 or 5 km. With the JavaScript API enabled, the selected distance appears as a circle; campus markers and matching hostel price pins remain on both road and satellite layers. Without a selected campus, cards identify the nearest sample coaching campus. Whole Kota clears the distance filter while preserving room preferences and the map layer.

The old schematic Explore map has been replaced. Its Google view receives all matching available hostels rather than only the current list page.

Two rendering modes are supported:

- **Embedded Google map:** the default when no browser API key is configured. This displays Google's map and supports Google place searches, pan/zoom, satellite view and centring on a selected coordinate. It does not overlay custom StayKota price pins. Hostels can still be selected from the adjacent list.
- **Google Maps JavaScript API:** set `VITE_GOOGLE_MAPS_API_KEY` to enable custom sample campus/price markers that select matching hostel cards. Enable Maps JavaScript API and billing in your own Google Cloud project. Pins use HTML `OverlayView` elements rather than Advanced Markers. The map intentionally has no map ID, so inline styles can hide all base-map POIs (shops, temples, etc.) and transit labels. Roads, neighbourhood names, Google branding and attribution remain. Default POI clicks are disabled. A vector renderer is requested for tilt; map-ID configuration is no longer needed. Place-text searches use the embedded Google view; clearing the search restores the marker view. No Places or Routes API is called.

Copy `.env.example` to `.env.local` for local configuration, or add those variable names in your deployment/environment settings. Restart Vite after changes and rebuild deployments: `VITE_*` values are included at build time. Never commit actual keys. A browser key is public by design: restrict it to your exact website/development referrers and the Maps JavaScript API in Google Cloud. Server/service-account credentials must not be used as browser keys. Verify current Google usage/billing terms before enabling a live project.

If the SDK fails to load or rejects authentication, the component falls back to the embedded map with a visible notice. Google branding and map attribution are not removed or covered. **Open in Google Maps** is available if embedding is blocked. Hidden map panels defer loading until visible.

The Codex network draft includes Google's map destinations and an optional blank browser-key variable. Draft saving does not apply those settings. Review/save and publish the environment to apply it. Live requests to `www.google.com` returned proxy `403 Forbidden` during this task, so live basemap/satellite content could not be verified here. No browser Maps key was available to verify authenticated markers. The unit tests and browser checks validate local flows and Google URL/selection/layer integration; the map-specific browser tests stub the external Google frame and do not claim Google content was rendered.

## Before real use

Replace simulated authentication and browser data with a backend that enforces roles, resource ownership, validation, rate limits and consent handling. Use actual reviewed inventory, photographs and campus coordinates. Configure real contact delivery, privacy/retention rules, backups, monitoring and public-page metadata/rendering before a live launch. A prototype admin role flag is not production authorization.

Proximity filters require valid coordinates and use straight-line distances, never claimed walking times. Only approved listings with matching available rooms are shown. The map covers Kota, but complete real hostel coverage requires a reviewed inventory and accurate campus/property coordinates from your backend. The embedded fallback explicitly indicates that custom markers are unavailable.

### 2D / 3D tilt

The full-city map has separate perspective and imagery controls. **2D** resets tilt and heading to zero; **3D tilt** requests a 45-degree viewing angle on Google's vector renderer and allows rotation/tilt interaction. Perspective changes preserve the centre, zoom, hostel selection, coaching radius and markers. Google may clamp tilt according to zoom. This is a tilted vector map, not a photorealistic 3D reconstruction; detailed building geometry depends on Google's local coverage and zoom, and has not been verified in Kota.

The 3D button is enabled only after an authenticated map reports vector rendering. It remains disabled on the embedded fallback, text-search embed and browsers that cannot provide vector rendering; the accompanying caption explains this limitation. Configure the browser key, rebuild, and verify both map layers and tilt on the deployed site. Automated browser tests cover the embed limitation and independent layer/perspective controls; authenticated vector rendering still requires live verification.

### Demo pins and live location

The coaching selector and custom map pins include multiple illustrative ALLEN campuses (Landmark, Talwandi, Samyak, Sangyan, Satyarth, Sankalp, Sakar, Safalya, Supath, Sabal and Samanway), plus Resonance, Motion, Vibrant, PW, Unacademy, Aakash, Bansal and Nucleon. This is a demo seed list, not a verified complete campus directory. Addresses, names and coordinates must be checked before real use. All matching approved demo hostels already supply their own price pins.

**Use my location** starts the browser's high-accuracy location watch only after a click and browser permission. It shows an updating blue location marker, an accuracy circle, and matching hostel results sorted by straight-line distance within 3 km by default (adjustable to 1/3/5 km). Centre on me resets the camera; Stop location, choosing a coaching campus, Whole Kota, submitting a place search, or leaving the page stops the watch. Coordinates are held in component memory, never written to app storage or the shareable page URL. The active location is sent to Google as part of displaying/centring the map, including the embedded fallback. The browser requires HTTPS (localhost is allowed). Denial, timeout, unsupported browsers and unavailable positions have recovery messages. Outside the sample inventory's range, empty results explain that these are demo Kota listings, rather than inventing nearby hostels.

The embedded fallback cannot hide Google's POIs or show custom pins/accuracy circles; the visible notice explains this. Location filtering and centring still work without a Maps key. Authenticated map styling, HTML overlays and blue-marker rendering require a real browser key and live Google verification. Browser tests simulate positions and failures; they do not access real location or verify live Google rendering.
