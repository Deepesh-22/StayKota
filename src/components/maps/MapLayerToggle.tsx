import { Layers, Map } from 'lucide-react';
import type { MapBasemap } from '../../lib/satellite-map';
export function MapLayerToggle({ basemap, onChange }: { basemap: MapBasemap; onChange: (value: MapBasemap) => void }) {
  return <div className="student-layer-toggle" role="group" aria-label="Map imagery">
    <button type="button" aria-pressed={basemap === 'street'} onClick={() => onChange('street')}><Map size={14}/> Map</button>
    <button type="button" aria-pressed={basemap === 'satellite'} onClick={() => onChange('satellite')}><Layers size={14}/> Satellite</button>
  </div>;
}
