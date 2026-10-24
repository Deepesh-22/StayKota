import type { CSSProperties } from 'react';

// A hand-composed illustration, deliberately independent of the geospatial map.
export const iso = (u: number, v: number, h = 0) => [410 + (u - v) * .84, 85 + (u + v) * .43 - h];
const point = (u: number, v: number, h = 0) => iso(u, v, h).join(',');
const plane = (u: number, v: number, w: number, d: number, h = 0) =>
  [point(u, v, h), point(u + w, v, h), point(u + w, v + d, h), point(u, v + d, h)].join(' ');
const path = (points: number[][]) => points.map(([u, v], i) => `${i ? 'L' : 'M'}${point(u, v)}`).join(' ');
const palettes = [
  ['#f0bd95', '#e2a981', '#bc795e'], ['#f5dec1', '#e9c6a2', '#c3a17f'],
  ['#bdd2bd', '#91b3a0', '#608e7c'], ['#ecc6b0', '#dba489', '#b98069'],
];

function Building({ u, v, w, d, h, tone = 0, campus = false }: { u: number; v: number; w: number; d: number; h: number; tone?: number; campus?: boolean }) {
  const [x, y] = iso(u + w / 2, v + d / 2, h / 2);
  const [roof, front, side] = palettes[tone];
  return <g>
    <polygon className="ks-building-shadow" points={plane(u + 8, v + 9, w + 3, d + 4)} />
    <g data-lift-x={x} data-lift-y={y} className="ks-lift" style={{ '--roof': roof, '--front': front, '--side': side } as CSSProperties}>
      <polygon className="ks-wall-side" points={[point(u + w, v, h), point(u + w, v + d, h), point(u + w, v + d), point(u + w, v)].join(' ')} />
      <polygon className="ks-wall-front" points={[point(u, v + d, h), point(u + w, v + d, h), point(u + w, v + d), point(u, v + d)].join(' ')} />
      <polygon className="ks-roof" points={plane(u, v, w, d, h)} />
      <polygon className="ks-roof-inset" points={plane(u + 4, v + 4, w - 8, d - 8, h + .5)} />
      {[.23, .58].map((col, i) => <g key={i}>{[.28, .61].map((floor, j) => <polygon key={j} className="ks-window" points={[point(u + w * col, v + d, h * floor + 5), point(u + w * col + 6, v + d, h * floor + 5), point(u + w * col + 6, v + d, h * floor - 2), point(u + w * col, v + d, h * floor - 2)].join(' ')} />)}</g>)}
      <path className="ks-building-line" d={`M${point(u + w, v + 6, h * .5)}L${point(u + w, v + d - 5, h * .5)}`} />
      {campus && <><polygon className="ks-solar" points={plane(u + 8, v + 9, w - 16, 12, h + 1)} /><path className="ks-door" d={`M${point(u + w * .5, v + d, 12)}L${point(u + w * .5, v + d, 0)}`} /></>}
    </g>
  </g>;
}

function Tree({ u, v, size = 1 }: { u: number; v: number; size?: number }) {
  const [x, y] = iso(u, v);
  return <g transform={`translate(${x} ${y}) scale(${size})`}>
    <ellipse className="ks-building-shadow" cx="5" cy="2" rx="13" ry="5" />
    <g className="ks-lift" data-lift-x={x} data-lift-y={y - 15}>
      <path className="ks-trunk" d="M0 1V-23" />
      <path className="ks-tree" d="M0-39C-9-40-17-29-13-19C-10-10 8-9 13-18C19-29 8-40 0-39Z" />
      <path className="ks-tree-line" d="M0-12V-31M0-21L-7-27M0-25L6-29" />
    </g>
  </g>;
}

const blocks = [
  [35, 25, 34, 28, 28, 1], [85, 25, 36, 28, 40, 0], [140, 25, 28, 30, 32, 3],
  [35, 78, 32, 37, 24, 3], [85, 78, 34, 37, 34, 1], [140, 80, 28, 34, 23, 2],
  [235, 22, 36, 30, 32, 1], [285, 22, 38, 30, 25, 0], [350, 22, 45, 30, 42, 3],
  [245, 80, 78, 42, 47, 2], [350, 80, 42, 40, 29, 1],
  [200, 286, 32, 30, 34, 1], [250, 286, 34, 30, 43, 3], [305, 286, 36, 30, 28, 0], [370, 280, 40, 38, 46, 2],
  [200, 342, 32, 32, 24, 3], [250, 342, 36, 32, 35, 2], [306, 345, 34, 30, 45, 1], [370, 345, 40, 32, 27, 0],
  [35, 390, 38, 28, 25, 0], [91, 390, 35, 28, 32, 1], [145, 390, 30, 28, 22, 2],
  [205, 400, 30, 23, 25, 1], [259, 400, 30, 23, 31, 0], [312, 400, 31, 23, 23, 3], [375, 400, 35, 23, 35, 1],
];
const trees = [[30, 135], [94, 137], [174, 100], [216, 38], [408, 52], [418, 122], [27, 280], [48, 300], [105, 282], [140, 292], [30, 340], [78, 346], [136, 351], [176, 323], [177, 375], [348, 331], [425, 325], [425, 389]];

export function KotaSketchDrawing() {
  return <g className="ks-drawing" strokeLinejoin="round" strokeLinecap="round">
    <polygon className="ks-ground-side" points={[point(0, 440), point(440, 440), point(440, 440, -8), point(0, 440, -8)].join(' ')} />
    <polygon className="ks-ground-side" points={[point(440, 0), point(440, 440), point(440, 440, -8), point(440, 0, -8)].join(' ')} />
    <polygon className="ks-ground" points={plane(0, 0, 440, 440)} />
    <g className="ks-streets">
      {[16, 67, 130, 184, 224, 278, 337, 418].map(v => <path key={`u${v}`} d={path([[0, v], [440, v]])} />)}
      {[18, 75, 129, 184, 240, 295, 355, 422].map(u => <path key={`v${u}`} d={path([[u, 0], [u, 440]])} />)}
    </g>
    <path className="ks-river-bank" d={path([[0, 145], [70, 154], [150, 181], [235, 189], [310, 180], [380, 191], [440, 210], [440, 269], [380, 249], [310, 242], [235, 250], [150, 242], [70, 217], [0, 208]]) + 'Z'} />
    <path className="ks-river" d={path([[0, 155], [70, 164], [150, 191], [235, 199], [310, 190], [380, 201], [440, 220], [440, 258], [380, 239], [310, 232], [235, 240], [150, 232], [70, 207], [0, 198]]) + 'Z'} />
    <g className="ks-water-lines"><path d={path([[12, 181], [70, 187], [110, 201]])} /><path d={path([[261, 216], [309, 211], [351, 216]])} /><path d={path([[348, 226], [394, 236], [424, 247]])} /></g>
    <polygon className="ks-park" points={plane(18, 268, 142, 91)} />
    <path className="ks-park-path" d={path([[25, 317], [75, 317], [108, 282], [148, 282]])} />
    <ellipse className="ks-pond" cx={iso(102, 326)[0]} cy={iso(102, 326)[1]} rx="24" ry="11" transform={`rotate(27 ${iso(102, 326).join(' ')})`} />
    <g className="ks-bridge">
      <polygon className="ks-bridge-side" points={[point(192, 171, 5), point(192, 261, 5), point(192, 261, 0), point(192, 171, 0)].join(' ')} />
      <polygon className="ks-bridge-deck" points={plane(192, 171, 20, 90, 5)} />
      {[194, 210].map(u => <g key={u}><path className="ks-cable" d={`M${point(u, 171, 6)}Q${point(u, 200, 9)} ${point(u, 212, 46)}Q${point(u, 236, 6)} ${point(u, 261, 6)}`} /><path className="ks-pylon" d={`M${point(u, 212, 0)}L${point(u, 212, 46)}`} />{[188, 200, 225, 240].map(v => <path className="ks-cable" key={v} d={`M${point(u, v, 6)}L${point(u, v, v < 212 ? (v - 171) * .7 : (261 - v) * .7)}`} />)}</g>)}
    </g>
    {blocks.map(([u, v, w, d, h, tone], i) => <Building key={i} {...{ u, v, w, d, h, tone }} campus={i === 9 || i === 14} />)}
    {trees.map(([u, v], i) => <Tree key={i} u={u} v={v} size={.65 + (i % 3) * .12} />)}
    <g className="ks-map-lettering">
      <text transform={`translate(${point(36, 183)}) rotate(27)`}>CHAMBAL RIVER</text>
      <text transform={`translate(${point(37, 374)}) rotate(27)`}>A LITTLE ROOM TO BREATHE</text>
      <text transform={`translate(${point(263, 150)}) rotate(27)`}>CLOSER TO CLASS</text>
    </g>
  </g>;
}
