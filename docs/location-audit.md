# Location accuracy audit

All 19 coaching campus coordinates in `src/data/campuses.ts` and all eight hostel coordinates in `src/data/mockData.ts` are **illustrative demo data**. None has been independently checked against a building entrance. Do not use these pins for directions or advertise them as verified. The fictional hostel names and addresses cannot be geocoded into real properties reliably.

During this audit, requests to ALLEN's official Kota address page, Resonance's contact page and OpenStreetMap Nominatim were blocked by the environment's network proxy (403). No coordinates were changed based on guesses. Satellite imagery is a basemap, not verification of a hostel or campus.

To replace a demo pin:

1. Obtain the precise campus/building name (not just the coaching brand), full street address and an official address URL; obtain an owner-confirmed hostel address and entrance pin.
2. Compare that address against an identifiable building/entrance on the map. Record latitude first and longitude second in decimal degrees. Confirm the entrance with the owner or campus staff.
3. Store the exact coordinate pair with `location.status`, `location.source` and `location.checkedAt` (YYYY-MM-DD). Only use `verified` after independent review; listing approval alone is insufficient.
4. Check for duplicate campus names, swapped coordinates, different branches and shared/relocated entrances. Recheck whenever the address changes.
5. Check both map views and the hostel detail page. Straight-line distances are estimates; they do not establish a walking route, crossing or travel time.

Owner listing forms accept optional entrance coordinates within a broad Kota envelope. Both coordinates must be supplied together. They remain owner-provided, unverified data. Missing coordinates stay absent; locality centres are never substituted. Clearing a saved coordinate pair must remain cleared after reload.

Required input to complete real placement: official links for each coaching campus plus real hostel addresses and owner-confirmed entrance coordinates. The current seed inventory remains explicitly labelled as demo data until those inputs are supplied.
