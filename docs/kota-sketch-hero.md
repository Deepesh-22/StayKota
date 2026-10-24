# Interactive Kota sketch hero

The landing hero opens on an ivory, monochrome isometric neighbourhood. Moving a mouse over the drawing reveals colour through a feathered circular mask: the Chambal becomes blue, park trees green and buildings warm terracotta or sage. Nearby buildings and trees lift by up to 9 SVG units while the illustration tilts by less than 3 degrees. The heading, search and navigation remain steady.

The illustration is a composition inspired by Kota, **not a georeferenced map**. Labels explicitly identify it as illustrative. It does not alter campus coordinates, hostel inventory, or the real Explore Kota map. The original `KotaNeighbourhood.tsx` artwork is retained in the source.

## Controls and navigation

- Pointer movement reveals a local area; leaving gently restores the sketch and level perspective.
- **Bring it to life / Back to sketch** toggles the complete colour scene. This is a native button supporting keyboard and touch, with `aria-pressed` and a visible focus outline.
- Four campus markers select the same campus as the search field and update the featured stays. Other campuses remain available in the full campus selector; they are not assigned invented positions in this drawing.
- The floating hostel card uses the currently matched room, its recurring monthly total, and the existing public preview route with campus, room and return context.
- **Get to know Kota / Explore the map** opens `/map` with the selected campus.
- On mobile the artwork is between the headline and search. Touch scrolling and pinch zoom remain native; the colour control provides the reveal without hover.
- Reduced-motion preference shows a static full-colour illustration with no lift or tilt. The redundant colour toggle is hidden and the hint changes. Runtime preference changes are supported.

## Implementation

No new dependency, paid plugin, API key, video, WebGL canvas or external illustration is needed. React renders a hand-composed SVG twice, once as a sketch and once as colour. A luminance mask blends the colour copy into the sketch. Isometric roofs, walls, window details, trees, park paths and a bridge provide depth.

`KotaSketchDrawing.tsx` contains the geometry, `KotaSketchHero.tsx` contains controls and links, `useKotaSketchMotion.ts` owns motion and `kota-sketch-hero.css` contains presentation and responsive styles. SVG definition IDs are unique per component instance.

The animation hook updates SVG/CSS values directly instead of rendering React on every pointer event. It smooths movement with elapsed-time-based interpolation and stops requesting frames when settled. It resets on offscreen visibility, document hiding, window blur, pointer cancellation and capability changes. Cleanup removes all listeners, cancels frames and disconnects the visibility observer. Existing hostel cover images remain the only remote imagery in this hero and have an icon fallback on load failure.

## Validation

Browser coverage checks local reveal and lift, settling on exit, keyboard toggle, campus selection, retained filter and preview links, touch interaction, no mobile overflow and reduced motion. Existing card, map, gallery and authentication browser scenarios remain in the full suite. Desktop, hover and mobile screenshots are under `docs/screenshots/kota-hero-*.png`.
