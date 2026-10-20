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

Browser tests use `/usr/bin/chromium` when available. Otherwise install the Playwright browser with `npx playwright install chromium`. No database is required. MapLibre and OpenFreeMap need Internet access for the basemap, but no API key.

## Experience

- **Landing:** custom isometric Kota illustration, accessible campus hotspots, synchronised search, a manually controlled hostel carousel and reduced-motion support.
- **Discovery:** linked map/card selection across result pages, explicit Show on map controls, campus centring, floating mobile List/Map controls, mobile filter sheet, readable cost/distance labels, campus and URL filters, available-room matching, inclusive monthly-cost budgets, AC-included filtering, sorting, pagination, OpenFreeMap basemap, custom hostel/coaching pins and mobile list/map views.
- **Hostel cards:** room cutaways with occupancy from the matched room, layered photo panels, subtle pointer depth and a Room/Photos switcher with manual photo controls. Touch, keyboard and reduced-motion preferences are supported. Save, compare and room pricing remain available.
- **Details:** curved CSS 3D photo showroom with arrows, keyboard, pointer drag, touch swipes, horizontal trackpad navigation, lightbox, image retry/empty states and reduced motion; blue-accented summary/contact actions, illustrative room cutaway, room selection, fixed monthly costs, separate deposits, metered-charge explanation, actual room features and consent-based visit enquiries.
- **Comparison:** up to three published hostels, independent room selectors and shareable public listing/room IDs.
- **Student:** favourites, requested visits, preferred-date changes, cancellation and profile persistence.
- **Location accuracy:** demo and unverified labels, shared coordinate validation, optional owner entrance coordinates with a Kota range check, and no guessed locality pins. See [the location audit](docs/location-audit.md) for evidence requirements and outstanding verification.
- **Loading:** route-level lazy loading, accessible loading placeholders and a recoverable page error state; the map loads when it enters view.
- **Owner:** own listings and enquiries, five-step create/edit wizard, saved drafts and moderation submission.
- **Admin:** review queue, approval/rejection, reports and local moderation activity.

The basemap uses MapLibre with OpenFreeMap/OpenStreetMap vector tiles. Default shop, temple, institutional and transit POI labels are hidden; road/city labels remain for orientation. Custom StayKota hostel/coaching pins use illustrative coordinates. Distances are straight-line Haversine estimates, never walking routes or travel times.

Showroom previews: [desktop](docs/screenshots/curved-gallery-desktop.png) · [mobile](docs/screenshots/curved-gallery-mobile.png) · [full detail page](docs/screenshots/hostel-showroom-fullpage.png). See [gallery implementation notes](docs/curved-gallery.md).

UI previews: [homepage](docs/screenshots/home-ui-polish.png) · [readable hostel card](docs/screenshots/explore-card-polish.png) · [mobile filter sheet](docs/screenshots/mobile-filter-sheet.png).

Card previews: [single card](docs/screenshots/room-card-concept.png) · [homepage carousel](docs/screenshots/room-card-carousel.png). The room drawing is an illustration, not a measured floor plan or a property tour.

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
| `/map` | Keyless city map, demo hostel/coaching search, 2D/3D tilt and live nearby search |
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

React 19, TypeScript, Vite 6, Tailwind CSS 4, React Router 7 and Lucide. Fonts and compressed WebP sample photos are hosted locally. SVG illustrations and CSS provide landing-page motion without a 3D engine. MapLibre is loaded in a separate map bundle and renders OpenFreeMap vector tiles. No Google Maps SDK, iframe or browser key is used.

- `src/components/home/`: campus scene and landing illustration.
- `src/components/hostel/`: cards, sample map and room cutaway.
- `src/pages/`: public pages and workspaces.
- `src/context/`: local prototype state and comparison.
- `src/data/`: sample inventory and campus coordinates.
- `src/lib/discovery.ts`: room prices, matching and distance helpers.
- `tests/`: unit and browser regression checks.

SPA rewrites for Vercel remain in `vercel.json`. Publishing or deployment is a separate step.

## Keyless Kota map

Open `/map` or select **Explore Kota**. The map opens over all of Kota and supports pan, zoom, rotation and a 2D/3D tilt switch. Search selects a known hostel/coaching or filters hostel names/localities. Room, category, budget and 1/3/5 km proximity filters share the same matching inventory as the hostel list. Numbered markers group nearby hostel/coaching pins at wider zoom; clicking a group expands its locations. Selected properties and campuses remain separate pins. The compact `/explore` map uses the same renderer.

Navigation stays inside a configured Kota urban envelope plus a rounded 3 km buffer. Shared pan/zoom constraints, a viewport-adaptive zoom floor, an outside-area mask and clipped 3D buildings apply to street, satellite, full-city and compact maps. This is a configurable navigation area, not a surveyed municipal boundary. Larger +/− buttons, a keyboard-accessible slider and **Reset Kota view** make zooming easier. Outside-area GPS and selected locations show an explanation while the map stays in Kota. The hostel-distance filter remains independent of this map limit.

Hover or keyboard-focus an individual hostel/coaching pin for a fixed 164 px dark circular preview with curved uppercase labels. Hostels use the existing property image; campuses use a transparent centre with a pin. Hover does not select or move the camera; click/tap keeps the existing actions. Escape, blur, pointer leave or map movement closes the preview. Preview positioning stays inside the map, and controls stay above its hit area. Circle crops: [hostel](docs/screenshots/map-hover-hostel-circle.png) · [coaching](docs/screenshots/map-hover-coaching-circle.png). These are component crops on an explicit test-style background, not proof of live basemap coverage.

The renderer loads `https://tiles.openfreemap.org/styles/liberty`, hides base-map POI symbols, and adds building extrusions when the style contains OpenMapTiles building data. Buildings become visible in 3D from zoom 14; actual geometry/heights depend on OpenStreetMap coverage. This is tilted vector rendering, not photorealistic imagery. **Map/Satellite** switches between OpenFreeMap streets and Esri World Imagery, with the same hostel/coaching pins. OpenStreetMap/source attribution and OpenFreeMap links remain visible. No API key, Google billing account or environment secret is needed.

MapLibre's worker is explicitly emitted as a local build asset, including in Vite development. Lazy loading keeps the map engine out of the initial application bundle. WebGL is required. Tile/style errors show an honest retry state and preserve manual hostel search; there is no automatic Google iframe fallback.

### Live location

The on-map crosshair or **Use my location** starts the browser's high-accuracy watch only after a click and permission. The button turns blue when active. A blue marker and accuracy circle show the current position; results sort by straight-line distance within 3 km by default (1/3/5 km selectable). Centre on me recentres without starting another watch. Stop location, selecting a coaching campus, Whole Kota, submitting a search, or leaving the page stops tracking. Coordinates stay in component memory, not app storage or the shareable URL. Visible tile requests reveal the viewed area to the basemap provider. HTTPS is required outside localhost. Denied, unavailable and timed-out positions show recovery messages. Outside the sample Kota inventory, an empty state explains the limited demo coverage. GPS outside the allowed map area does not pan the map away from Kota.

The demo catalogue includes multiple ALLEN campuses, Resonance, Motion, Vibrant, PW, Unacademy, Aakash, Bansal and Nucleon. Campus names/addresses/coordinates are illustrative and not a verified complete directory. Replace these with reviewed records before launch.

### Network and validation

Allow HTTPS to `tiles.openfreemap.org` (style, vector tiles, fonts and sprites), `openfreemap.org`, and `server.arcgisonline.com` (satellite tiles and credits). Public deployed browsers use their own network; the restricted Codex environment has a saved network draft for those domains. To apply that draft, review/save environment settings and publish the environment. Draft saving does not change the running proxy. Live style requests returned proxy `403` here, so live basemap/coverage verification is still pending; this is separate from API-key configuration, which is no longer required.

Unit tests cover POI-layer filtering, building-layer setup, radius geometry, valid coordinates and zoom grouping. Browser tests run the real MapLibre WebGL engine and local worker against an explicitly labelled minimal style fixture (no live tiles), and verify marker expansion/selection, 2D/3D controls, attribution, nearby filters, live-location lifecycle, mobile layout and retry states. They do not claim the fixture is a live Kota basemap.

## Before real use

Replace simulated authentication and browser data with a backend that enforces roles, resource ownership, validation, rate limits and consent handling. Use actual reviewed inventory, photographs and campus coordinates. Configure real contact delivery, privacy/retention rules, backups, monitoring and public-page metadata/rendering before a live launch. A prototype admin role flag is not production authorization.

Real hostel coverage requires reviewed inventory and accurate coaching/property coordinates. Unlocated properties are excluded from pin rendering rather than assigned invented coordinates.

### Satellite imagery

Map/Satellite controls are available on `/map` and the compact Explore map. `/map?type=satellite` opens the imagery view directly. The raster source uses Esri's public World Imagery service (`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer`) with z/y/x tile ordering and no key parameter. Its published copyright text is fetched when imagery is selected, escaped as plain text and displayed with a link to the source credits. This imagery is separate from OpenStreetMap data; keep the attribution and review Esri's current service/usage terms for a production deployment. Availability and image resolution/date vary by location.

Switching imagery adds/removes a raster layer on the existing MapLibre instance. It preserves pan/zoom, selected hostel/campus, room/radius filters, location watch, radius/accuracy circles and 2D/3D pitch. Other street layers remain visible while imagery loads, then are hidden; their original visibility is restored when Map is selected. The 3D building overlay still comes from OpenStreetMap geometry rather than photorealistic Esri models. Satellite source failure keeps the street map and custom pins visible with a dedicated retry action.

The imagery endpoint returned proxy `403` in this cloud environment. Its domain has been added to the saved network draft; review/save and publish environment settings to apply it. Live imagery/coverage remains unverified. Browser tests use the actual MapLibre raster renderer with explicitly labelled tiny PNG fixtures, test source credits and attribution, and exercise outage/retry and location/selection/camera preservation. These fixtures do not claim to show satellite imagery of Kota.
