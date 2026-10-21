# Landing-page card reveal

The featured collection on `/` adapts the supplied floating-card reference. Closed cards show the room cutaway, hostel name/locality, save control and monthly total. Clicking the illustration, summary or “Take a closer look” unfolds the selected card into two separate panels: existing photos on the left, and the address, campus proximity, room cost/deposit, amenities, compare control and preview link on the right. Other cards move aside along the track. Close preview or Escape folds it back into a compact card.

Desktop browsing supports mouse dragging. An 8 px threshold separates a drag from a click, and the click that follows a drag is suppressed. Hovering in a 76 px zone near either track edge moves it gently in that direction, proportional to proximity and capped at 150 px/s. Movement stops in the centre, outside the track, at a boundary, on a control, on keyboard focus, on wheel input, on window blur or when a preview opens. Mouse browsing retains its final position without snapping back. There is no automatic playback.

On screens up to 700 px the two panels stack vertically. Native touch scrolling and pinch zoom remain available; no custom touch gesture prevents vertical page scrolling. A trackpad and labelled Previous/Next buttons also browse the collection. The arrows switch the expanded hostel and bring the selected photo into view on mobile. Only one card opens at a time. Changing campus, room, budget or category starts a fresh deck; single-match and empty-result states remain supported.

Open controls expose `aria-expanded` and `aria-controls`. Closed photo/details controls are inert and hidden from assistive technology. Opening a photo/summary control moves focus to the stable close toggle; Escape returns focus to that toggle after collapsing. Reduced-motion preferences disable edge-hover movement and reveal transitions; manual dragging and buttons remain available. Failed photos expose a retry action without changing the selected room or its price.

Implementation uses React, CSS clipping/transitions and cancellable animation-frame scrolling. Drag capture, animation frames, focus/visibility listeners and click suppression are cleaned up. No new dependencies, external photo assets or 3D engine were added. Standard Explore cards retain their existing Room/Photos view. Hostel preview/detail navigation and the existing login guard are preserved.

The cutaway remains a concept illustration. Existing sample photographs and demo coordinates are still labelled as such. This change does not verify locations or introduce production authentication.

Review images:

- `screenshots/landing-card-compact.png`
- `screenshots/landing-card-reveal-desktop.png`
- `screenshots/landing-card-reveal-mobile.png`

Browser scenarios cover compact/hidden details, one-at-a-time unfolding, photo navigation/retry, unchanged costs/comparison and preview → login → selected room navigation; desktop drag/click separation, edge-hover direction and stopping, keyboard focus/Escape, reduced motion, native touch scrolling and immediate interruption of opening animations, mobile/tablet layout, filters and single/empty results.
