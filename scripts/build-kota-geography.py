"""Build the geographic hero from pinned public-domain Natural Earth geometry.
Run: python3 scripts/build-kota-geography.py [directory containing source GeoJSON]
No runtime map service or third-party Python package is required.
"""
import hashlib
import json
import pathlib
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
REVISION = 'ca96624a56bd078437bca8184e78163e5039ad19'
BOUNDS = [75.72, 25.06, 75.96, 25.285]
SOURCE = f'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/{REVISION}/geojson/'


def coordinates(value):
    if not value:
        return
    if isinstance(value[0], (float, int)):
        yield value
    else:
        for child in value:
            yield from coordinates(child)


def clip_line(points):
    """Liang–Barsky clip, preserving disconnected segments at viewport edges."""
    west, south, east, north = BOUNDS
    lines, current = [], []
    for a, b in zip(points, points[1:]):
        x, y = a[:2]
        dx, dy = b[0] - x, b[1] - y
        lo, hi, visible = 0, 1, True
        for p, q in [(-dx, x-west), (dx, east-x), (-dy, y-south), (dy, north-y)]:
            if p == 0:
                if q < 0:
                    visible = False
                    break
            elif p < 0:
                lo = max(lo, q/p)
            else:
                hi = min(hi, q/p)
        if not visible or lo > hi:
            if current:
                lines.append(current)
                current = []
            continue
        start = [round(x + lo*dx, 6), round(y + lo*dy, 6)]
        end = [round(x + hi*dx, 6), round(y + hi*dy, 6)]
        if current and current[-1] != start:
            lines.append(current)
            current = []
        if not current:
            current.append(start)
        current.append(end)
    if current:
        lines.append(current)
    return lines


features, sources = [], []
for layer, name in [('urban', 'urban_areas'), ('roads', 'roads'), ('river', 'rivers_lake_centerlines')]:
    filename = f'ne_10m_{name}.geojson'
    if len(sys.argv) > 1:
        raw = (pathlib.Path(sys.argv[1]) / filename).read_bytes()
    else:
        with urllib.request.urlopen(SOURCE + filename, timeout=90) as response:
            raw = response.read()
    sources.append({'file': filename, 'url': SOURCE + filename, 'sha256': hashlib.sha256(raw).hexdigest()})
    for feature in json.loads(raw)['features']:
        geometry, props = feature['geometry'], feature['properties']
        if not geometry:
            continue
        points = list(coordinates(geometry['coordinates']))
        if not points:
            continue
        if layer == 'urban':
            # Retain the complete original Kota urban polygon, not a viewport rectangle.
            if not all(BOUNDS[0] <= p[0] <= BOUNDS[2] and BOUNDS[1] <= p[1] <= BOUNDS[3] for p in points):
                continue
            if props.get('area_sqkm', 0) < 100:
                continue
            selected = geometry
        else:
            if layer == 'river' and props.get('name') != 'Chambal':
                continue
            lines = [geometry['coordinates']] if geometry['type'] == 'LineString' else geometry['coordinates']
            clipped = [part for line in lines for part in clip_line(line)]
            if not clipped:
                continue
            selected = {'type': 'MultiLineString', 'coordinates': clipped}
        features.append({'type': 'Feature', 'properties': {'layer': layer, 'name': props.get('name') or ('Kota urban footprint' if layer == 'urban' else 'Major route'), 'sourceType': props.get('type') or props.get('featurecla')}, 'geometry': selected})

assert sum(f['properties']['layer'] == 'urban' for f in features) == 1
assert any(f['properties']['layer'] == 'river' for f in features)
result = {'type': 'FeatureCollection', 'bbox': BOUNDS, 'metadata': {'source': 'Natural Earth', 'scale': '1:10 million', 'license': 'Public domain', 'revision': REVISION, 'description': 'Generalised geographic overview of Kota. Urban footprint is not a municipal boundary. River is a centreline, not surveyed banks. Roads are major routes, not a street inventory.', 'sources': sources}, 'features': features}
output = ROOT / 'src/data/kota-geography.json'
output.write_text(json.dumps(result, separators=(',', ':'), ensure_ascii=False) + '\n')
print(f'{output}: {len(features)} features, {output.stat().st_size} bytes')
