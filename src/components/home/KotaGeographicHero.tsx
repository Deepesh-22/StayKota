import { useId, useRef, useState } from 'react';
import { ArrowUpRight, Compass, Palette } from 'lucide-react';
import { Link } from 'react-router-dom';
import { KOTA_FOCUS_AREAS, KOTA_GEOGRAPHIC_PATHS, ATLAS_TWO_KM, projectKota } from '../../lib/hero-geography';
import { useGeographicReveal } from './useGeographicReveal';
import { useKotaBasemap } from './useKotaBasemap';

type Area = typeof KOTA_FOCUS_AREAS[number];
function MapGeometry() {
  return <>{KOTA_GEOGRAPHIC_PATHS.map(path => <path key={path.id} className={`atlas-path atlas-${path.layer}`} data-layer={path.layer} d={path.d} fillRule="evenodd" />)}</>;
}

export function KotaGeographicHero({ campusId }: { campusId: string }) {
  const id = useId().replace(/:/g, '');
  const figure = useRef<HTMLElement>(null), renderer = useRef<HTMLDivElement>(null);
  const basemap = useKotaBasemap(figure, renderer);
  const svg = useRef<SVGSVGElement>(null), lens = useRef<SVGCircleElement>(null);
  const [selected, setSelected] = useState<Area | null>(null);
  const [hovered, setHovered] = useState<Area | null>(null);
  const [colour, setColour] = useState(false);
  const area = hovered ?? selected;
  useGeographicReveal(svg, lens, area, colour);
  const [focusX, focusY] = projectKota((area ?? KOTA_FOCUS_AREAS[0]).longitude, (area ?? KOTA_FOCUS_AREAS[0]).latitude);
  const [riverX, riverY] = projectKota(75.812, 25.182);

  return <figure ref={figure} className="kota-atlas" data-map-state={basemap.status} aria-label="Geographic map of Kota, Rajasthan">
    <div className="atlas-renderer-shell" aria-hidden="true"><div ref={renderer} className="atlas-renderer" /></div>
    <div className="atlas-coordinates"><span>25° 11′ N / 75° 50′ E</span><span>KOTA, RAJASTHAN · INDIA</span></div>
    <div className="atlas-composition">
      <div className="atlas-map">
        <svg ref={svg} viewBox="0 0 700 650" className="atlas-svg" role="img" aria-labelledby={`${id}-title ${id}-description`}>
          <title id={`${id}-title`}>{basemap.image ? 'OpenStreetMap of Kota, its roads and the Chambal River' : 'Kota’s urban footprint, Chambal River and major road routes'}</title>
          <desc id={`${id}-description`}>{basemap.image ? 'Real OpenStreetMap geometry, north up. Move over the map or choose an area to reveal colour. Open Explore Kota for interactive street-level browsing.' : 'A generalised geographic overview from Natural Earth at 1:10 million scale while street-map data is unavailable. Urban footprint is not an official municipal boundary; the river is a centreline.'}</desc>
          <defs>
            <radialGradient id={`${id}-reveal`}><stop stopColor="white" offset="0" /><stop stopColor="white" offset=".7" /><stop stopColor="black" offset="1" /></radialGradient>
            <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width="700" height="650" style={{ maskType: 'luminance' }}><rect width="700" height="650" fill="black" /><circle ref={lens} className="atlas-lens" cx="350" cy="325" r="155" fill={`url(#${id}-reveal)`} /></mask>
            <pattern id={`${id}-hatch`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0V7" stroke="#575447" strokeOpacity=".12" strokeWidth=".5" /></pattern>
          </defs>
          <g className="atlas-ink">{basemap.image ? <image className="atlas-ink-image" href={basemap.image.ink} width="700" height="650" /> : <MapGeometry />}</g>
          {!basemap.image && KOTA_GEOGRAPHIC_PATHS.filter(path => path.layer === 'urban').map(path => <path key={path.id} d={path.d} fill={`url(#${id}-hatch)`} pointerEvents="none" />)}
          <g className="atlas-colour" mask={`url(#${id}-mask)`}>{basemap.image ? <image href={basemap.image.colour} width="700" height="650" /> : <MapGeometry />}</g>
          <g className="atlas-lettering" aria-hidden="true"><text x="390" y="314" className="atlas-city-name">KOTA</text><text x="390" y="332" className="atlas-city-subtitle">A PLACE TO BEGIN</text><text x={riverX - 17} y={riverY} transform={`rotate(-48 ${riverX - 17} ${riverY})`} className="atlas-river-name">CHAMBAL RIVER</text></g>
          <g className={`atlas-focus ${area ? 'is-visible' : ''}`} transform={`translate(${focusX} ${focusY})`} aria-hidden="true"><circle r="20" className="atlas-focus-halo" /><circle r="6" className="atlas-focus-dot" /></g>
          <g className="atlas-compass" transform="translate(620 74)" aria-hidden="true"><text textAnchor="middle" y="-23">N</text><path d="M0-12L5 9L0 5L-5 9Z" /><path d="M0 17V30M-15 5H-9M9 5H15" className="atlas-compass-line" /></g>
          <g className="atlas-scale" transform="translate(80 606)" aria-hidden="true"><path d={`M0-4V0H${ATLAS_TWO_KM}V-4`} /><text y="16">APPROX. 2 KM</text></g>
        </svg>
        <div className="atlas-map-note"><span>01 — KOTA AT A GLANCE</span><p>{area?.caption ?? 'Find your bearings. Make it your city.'}</p></div>
      </div>
      <aside className="atlas-areas" aria-label="Explore areas of Kota">
        <span className="atlas-area-kicker">TAKE A CLOSER LOOK</span>
        <div className="atlas-area-list">{KOTA_FOCUS_AREAS.map((item, index) => <button key={item.id} type="button" className={area?.id === item.id ? 'is-active' : ''} aria-pressed={selected?.id === item.id} onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(item); }} onPointerLeave={() => setHovered(null)} onFocus={() => setHovered(item)} onBlur={() => setHovered(null)} onClick={() => setSelected(current => current?.id === item.id ? null : item)}><span className="atlas-area-number">0{index + 1}</span><span>{item.name}</span><span className="atlas-area-tick" aria-hidden="true" /></button>)}</div>
        <span className="atlas-area-footnote">Views of the city.<br />Not administrative zones.</span>
        <Link className="atlas-open-map" to={`/map?campus=${campusId}`}><Compass size={16} />Explore Kota<ArrowUpRight size={16} /></Link>
      </aside>
    </div>
    <div className="atlas-bottom"><p><span className="atlas-desktop-hint">Move over the map to reveal its colours.</span><span className="atlas-touch-hint">Tap an area to reveal its colours.</span><span className="atlas-reduced-hint">Kota, in colour. Choose an area to explore.</span></p><button className="atlas-colour-toggle" type="button" aria-pressed={colour} onClick={() => setColour(value => !value)}><Palette size={14} />{colour ? 'Show ink sketch' : 'Show all colours'}</button></div>
    {basemap.status !== 'ready' && <div className="atlas-service-status" role="status">{basemap.status === 'loading' ? 'Loading street detail. Showing the geographic overview.' : 'Street detail unavailable. Showing a generalised geographic overview.'}{basemap.status === 'error' && <button type="button" onClick={basemap.retry}>Retry street detail</button>}</div>}
    <figcaption className="atlas-attribution">{basemap.image ? <><span>© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a></span><a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer">OpenFreeMap ↗</a></> : <><span>Overview · generalised urban outline</span><a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noopener noreferrer">Map data: Natural Earth ↗</a></>}</figcaption>
  </figure>;
}
