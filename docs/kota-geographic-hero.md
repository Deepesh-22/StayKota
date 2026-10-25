# Geographic Kota hero

This replaces the hand-composed isometric hero with an editorial, north-up map: ivory paper, ink-like linework, an orange heading accent and a right-side area selector. Pointer movement reveals colour over the same geographic features. Touch and keyboard users can choose a focus area or show all colours. Reduced motion displays the coloured map without animated reveal movement.

## Data and accuracy

The primary map uses **OpenStreetMap vector geometry served by OpenFreeMap**, through the same public style URL already used by Explore Kota. The hero retains source geometry and filters, restyles land, water and roads, and removes POI/symbol layers. It does not use the illustrative campus `sceneX/sceneY` positions or plot unverified demo properties. Actual map detail depends on OpenStreetMap coverage and the service being reachable.

The map view is bounded by 75.72–75.96° E and 25.06–25.285° N. Both the basemap and SVG overlay use north-up Web Mercator, a 700 × 650 viewport, and matching fit padding. The drawing shows geographic context around Kota, not a claimed municipal boundary. Whole Kota, The Chambal, North Kota and South Kota are **focus views**, not administrative divisions. These controls reveal colour; Explore Kota opens the full interactive map and preserves the chosen coaching campus.

If the map service is unavailable or still loading, the hero uses a bundled **Natural Earth 1:10 million** geographic overview. The UI identifies this as generalised and offers retry. This fallback contains the sourced urban footprint, four major road routes and the Chambal centreline. It is not a street inventory, surveyed riverbank or official boundary. No roads, parks, district borders or buildings are invented to fill gaps.

`src/data/kota-geography.json` records source URLs, a pinned upstream revision, SHA-256 hashes, scale and public-domain terms. Rebuild with `python3 scripts/build-kota-geography.py`, or supply a directory of the three source GeoJSON files as its first argument. The script retains the complete Kota urban polygon and clips line segments to the viewport, preserving breaks. The dataset is approximately 5.3 KB before compression.

Sources:
- OpenStreetMap: https://www.openstreetmap.org/copyright
- OpenFreeMap: https://openfreemap.org
- Natural Earth public-domain terms: https://www.naturalearthdata.com/about/terms-of-use/
- Pinned Natural Earth source: https://github.com/nvkelso/natural-earth-vector/tree/ca96624a56bd078437bca8184e78163e5039ad19/geojson

## Rendering and performance

No new dependency or paid map key is required. `useKotaBasemap` waits until the hero is near the viewport, fetches the public style and dynamically loads the existing MapLibre dependency. One offscreen map renders the actual vector data. Once all tiles are loaded, it captures the colour view, changes only paint properties to capture an ink view with light fills and dark outlines, and **removes the WebGL map**. Both images use the same camera and cached source tiles, avoiding duplicate map instances and alignment drift. Attribution remains visible outside the image.

The 700 × 650 render uses a capped 1.5 pixel ratio. It is intended as a landing illustration, not a zoomable street map. Requests have a 15-second recovery timeout, retry is explicit, unmount aborts work, and blob URLs are revoked. Colour reveal updates run through a frame loop that sleeps once settled and stops on page hiding or when offscreen. The mobile page retains native scrolling and pinch zoom.

`hero-map-style.ts` owns the map treatment. `hero-geography.ts` projects fallback geometry and focus coordinates. `KotaGeographicHero.tsx` owns presentation, focus controls, attribution and recovery messaging. The earlier sketch components remain in source for reference.

## Validation and limits

The cloud workspace returns HTTP 403 for OpenFreeMap and OSM tile services, including an elevated download attempt. Consequently **live tile loading was not verified here**. Browser tests run the real MapLibre renderer against explicit local geographic fixtures; they do not establish current provider availability. Other checks cover unavailable-service fallback/retry, registered ink/colour imagery, release of the WebGL canvas, hover exit, keyboard/touch controls, reduced motion and retained campus search. Unit tests cover projection orientation, geographic provenance, scale and preservation of map source/filter metadata.

Review screenshots named `kota-geographic-fallback-*.png` show the labelled offline overview. They are not represented as live street-map screenshots. The existing hostel cards, precise map page and login flows are checked in the regression suite.

## PR relationship

This change is on `feat/kota-geographic-hero`, with `feat/landing-card-reveal` as its PR base while PR #2 is open. Merge PR #2 first and then retarget this PR to `main`. This keeps the new map review separate from the earlier card and sketch changes.
