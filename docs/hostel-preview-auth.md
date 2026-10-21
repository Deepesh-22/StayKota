# Hostel previews and detail-page access

Clicking a hostel pin/circle on the city map or Explore map opens `/hostel/:id/preview`. The bottom selection strips have been replaced with a dedicated public preview. The city map retains its selected marker/list state, a Clear selection control, filters, current-location controls, satellite view and Kota navigation limits. Coaching pins continue to centre the map.

The preview renders a cover photo, hostel name/category, address, selected-room fixed monthly total and coaching proximity. No full room-options section, property gallery, house rules, contact information or complete cost table is rendered there. Sample images and coordinates remain labelled. Missing/unpublished properties retain the not-found behavior, and failed covers have an explicit fallback.

**See full details** opens `/hostel/:id` for signed-in users. Guests go to `/login?role=student&reason=hostel-details&redirect=...`. Create an account opens the same login page in signup mode. The validated internal redirect keeps campus, room, return path and detail-section hash. A contextual login card shows which hostel the user is returning to. One authentication effect owns the redirect, avoiding a delayed second navigation. Without an explicit return path, existing owner/admin workspace destinations remain unchanged.

`RequireHostelLogin` also guards direct full-detail URLs and reloads, and unmounts the detail page on logout. Unpublished/unknown IDs remain not-found rather than disclosing listing information through a login prompt. Public discovery and comparison remain available. Guest listing cards and the homepage scene route through previews; signed-in room-card users can still open details directly.

## Important authentication boundary

This repository is still a frontend prototype. Authentication uses the existing labelled demo OTP/sample-account flows and browser-storage session. Registration creates a demo profile, not a server account. The UI route guard is **not a server authorization boundary**: seed data and localStorage are accessible to the browser. It does not secure real private hostel data against client inspection or modified localStorage.

Before production, use a real authentication service/server session and enforce authorization on every private detail/contact/gallery API response. Return only public summary fields from public preview/discovery endpoints; do not preload private fields into the client. Server-side login/session verification must protect full-detail payloads. No real OTP, email, call, booking or owner notification was added by this change.

## Validation

Browser checks cover marker-to-preview navigation, guest summary fields, no full-detail DOM before login, direct URL/reload guards, same-room login return, registration, signed-in preview access, logout, unpublished previews, unsafe return URLs, failed covers, mobile overflow and return-to-map/filters. Existing map/satellite/location/gallery/visit tests remain in place with authenticated setup where full details now require login.

Preview PNGs are real production-build screenshots with the existing illustrative sample photography. They are saved under `docs/screenshots/hostel-preview-desktop.png`, `hostel-preview-mobile.png` and `hostel-details-login.png`.
