# Hostel photo showroom

Every published hostel detail route uses `CurvedPhotoGallery`, an independent CSS 3D image-plane carousel. It runs without WebGL or new dependencies. The selected photograph sits forward; neighbouring photographs rotate and recede. There is no auto-play.

Controls: previous/next buttons, photo indicators, left/right arrows, Home/End, mouse drag, horizontal trackpad scrolling and touch swipes. The centre photo opens the existing lightbox at the correct index. Vertical wheel/touch scrolling and pinch-to-zoom remain native. Reduced motion removes animated changes. Pointer capture changes from an implicitly captured touch button must not cancel the gallery drag.

Images come from the hostel's existing `coverImage` and `images` fields. `photoCaptions` supplies optional captions by image URL; unknown photos get neutral numbered labels. Current generated sample photography is marked `illustrative`. Set `photography: 'property'` only for supplied property images. Missing images show an empty state; failed images show an error and retry control rather than substituting an unrelated room. Real photos of bathrooms, study areas and dining rooms should only be added when supplied.

The summary uses the selected room's fixed monthly cost and existing visit request flow. Contact details, ratings and refund policies appear only when supplied through the optional structured fields. Missing contact information has an explicit fallback; no placeholder phone number is called. A visit enquiry is not a reservation.

`HostelProximityMap` reuses MapLibre with exactly the selected campus and hostel, fitting the two coordinates into view. Demo pins require an explicit preview. Missing coordinates show a fallback. Straight-line distances are labelled, and walking/driving links are only built for valid non-demo endpoints; Google Maps calculates the actual route externally. No travel time is invented. Live basemap access remains subject to the environment/network limits described in README.

Validation covers arrow/keyboard/drag/trackpad navigation, real browser touch swipes, native vertical scrolling, reduced motion, lightbox index, contact/map fallbacks, missing/failed/retried images, marker counts and route URL endpoints. Existing room, visit, comparison, map/satellite and location tests remain in place.
