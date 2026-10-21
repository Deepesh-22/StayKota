# Landing-page card reveal

The featured hostel collection on `/` adapts the supplied floating-card reference. Compact cards keep the room cutaway, category, price, campus proximity, save/compare controls and public-preview link. “Take a closer look” expands a selected card horizontally on desktop and reveals the listing's existing photos beside its summary and address. Other cards move along the horizontal track. “Back to room” or Escape collapses it.

On screens up to 700 px the same interaction expands vertically within the card. Touch swiping, a trackpad and labelled Previous/Next buttons browse the collection. The arrows also switch the expanded hostel, and bring its photo back into view on mobile. Only one card opens at a time. Changing campus, room, budget or category starts a fresh deck; single-match and empty-result states remain supported.

The toggle exposes `aria-expanded` and `aria-controls`. Closed photo controls are inert. Escape from the card or carousel controls returns focus to the selected card's toggle. Reduced-motion preferences remove the reveal animation and use immediate scrolling. Failed photos expose a retry action without changing the room or its price.

Implementation uses React, CSS clipping/transitions and a short cancellable animation-frame scroll adjustment. No new dependencies, external photo assets, 3D engine or automatic carousel playback were added. The standard Explore cards retain their existing Room/Photos view. Hostel preview/detail navigation and the existing login guard are unchanged.

The cutaway remains a concept illustration. Existing sample photographs and demo coordinates are still labelled as such. This change does not verify locations or introduce production authentication.

Review images:

- `screenshots/landing-card-compact.png`
- `screenshots/landing-card-reveal-desktop.png`
- `screenshots/landing-card-reveal-mobile.png`

The browser scenarios cover photo navigation/retry, one-at-a-time expansion, carousel bounds, keyboard/Escape, reduced motion, native touch scrolling, mobile/tablet layout, filter resets, single/empty results, unchanged costs/comparison and preview → login → selected room navigation.
