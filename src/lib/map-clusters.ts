import { validCoordinates } from './maps';
export interface StudentMapPin {
  id: string;
  kind: 'hostel' | 'campus';
  latitude: number;
  longitude: number;
}
export interface PinGroup {
  id: string;
  latitude: number;
  longitude: number;
  pins: StudentMapPin[];
}
function worldPixel(pin: StudentMapPin, zoom: number) {
  const size = 256 * 2 ** zoom;
  const sin = Math.sin(Math.max(-85.0511, Math.min(85.0511, pin.latitude)) * Math.PI / 180);
  return { x: (pin.longitude + 180) / 360 * size, y: (.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size };
}
/** Screen-distance grouping keeps fixed-size pins legible as the map zooms out. */
export function groupMapPins(pins: StudentMapPin[], zoom: number, selectedIds: string[] = []): PinGroup[] {
  const groups: (PinGroup & { x: number; y: number; selected: boolean })[] = [];
  for (const pin of [...pins].filter(p => validCoordinates(p.latitude, p.longitude)).sort((a, b) => a.id.localeCompare(b.id))) {
    const pixel = worldPixel(pin, Number.isFinite(zoom) ? zoom : 12);
    const selected = selectedIds.includes(pin.id);
    const group = selected ? undefined : groups.find(g => !g.selected && Math.hypot(g.x - pixel.x, g.y - pixel.y) < 76);
    if (group) {
      const n = group.pins.length;
      group.latitude = (group.latitude * n + pin.latitude) / (n + 1);
      group.longitude = (group.longitude * n + pin.longitude) / (n + 1);
      group.x = (group.x * n + pixel.x) / (n + 1);
      group.y = (group.y * n + pixel.y) / (n + 1);
      group.pins.push(pin);
      group.id = group.pins.map(p => p.id).join('|');
    } else groups.push({ id: pin.id, latitude: pin.latitude, longitude: pin.longitude, pins: [pin], ...pixel, selected });
  }
  return groups.map(({ id, latitude, longitude, pins }) => ({ id, latitude, longitude, pins }));
}
