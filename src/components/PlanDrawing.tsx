import type { Ref } from 'react'
import { ROOMS, WALLS, type Opening, type Room, type Vec2, type WallDef } from '../lib/plan'
import { FURNITURE } from '../lib/furniture'

// the updated floor plan as a clean 2D drawing, generated from the same data as the 3D model
// units are plan millimetres (svg y = plan z)

const INK = '#3d3935'
const FILL: Record<Room['floor'], string> = { oak: '#f5efe4', tile: '#eef0ee', stone: '#ece8e1' }
const VIEW = { x: -1300, y: -2300, w: 13400, h: 14200 }

const area = (pts: Vec2[]) =>
  Math.abs(pts.reduce((s, [x, z], i) => {
    const [nx, nz] = pts[(i + 1) % pts.length]
    return s + x * nz - nx * z
  }, 0)) / 2

const centroid = (pts: Vec2[]): Vec2 => {
  let cx = 0, cz = 0, a = 0
  pts.forEach(([x, z], i) => {
    const [nx, nz] = pts[(i + 1) % pts.length]
    const f = x * nz - nx * z
    a += f
    cx += (x + nx) * f
    cz += (z + nz) * f
  })
  return [cx / (3 * a), cz / (3 * a)]
}

// one opening drawn in the wall's own frame (x along the wall, y across it)
function OpeningMark({ o, t }: { o: Opening; t: number }) {
  const x0 = o.at - o.width / 2
  const x1 = o.at + o.width / 2

  if (o.kind === 'window') {
    return (
      <g stroke={INK} strokeWidth={10} fill="#fff">
        <rect x={x0} y={-t / 2} width={o.width} height={t} />
        <line x1={x0} x2={x1} y1={-18} y2={-18} />
        <line x1={x0} x2={x1} y1={18} y2={18} />
      </g>
    )
  }

  if (o.kind === 'slide') {
    const w = o.width / 2 + 40
    return (
      <g stroke={INK} strokeWidth={10} fill="#fff">
        <rect x={x0} y={-45} width={w} height={30} />
        <rect x={x1 - w} y={15} width={w} height={30} />
        <path d={`M ${x1 - 250} 110 h -450 m 90 -50 l -90 50 l 90 50`} fill="none" strokeWidth={14} />
      </g>
    )
  }

  // hinged door: leaf drawn open at 90° plus its swing arc
  const dir = o.hinge === 'start' ? 1 : -1
  const hx = o.hinge === 'start' ? x0 : x1
  const hy = (o.side * t) / 2
  const L = o.width
  const sweep = dir * o.side > 0 ? 1 : 0
  return (
    <g stroke={INK} fill="none">
      <path d={`M ${hx + dir * L} ${hy} A ${L} ${L} 0 0 ${sweep} ${hx} ${hy + o.side * L}`} strokeWidth={8} strokeDasharray="40 30" />
      <rect
        x={dir > 0 ? hx : hx - 40}
        y={o.side > 0 ? hy : hy - L}
        width={40}
        height={L}
        fill={o.glazed ? '#fff' : INK}
        strokeWidth={10}
      />
      {o.mirror && (
        <line x1={hx - dir * 60} x2={hx - dir * 60} y1={hy + o.side * 80} y2={hy + o.side * (L - 80)} stroke="#8a7a66" strokeWidth={24} />
      )}
    </g>
  )
}

function WallMark({ a, b, t, height, openings = [] }: WallDef) {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1])
  const angle = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI

  // solid parts between the openings
  const solid: [number, number][] = []
  let cursor = 0
  for (const o of openings) {
    solid.push([cursor, o.at - o.width / 2])
    cursor = o.at + o.width / 2
  }
  solid.push([cursor, length])

  return (
    <g transform={`translate(${a[0]} ${a[1]}) rotate(${angle})`}>
      {solid.map(([x0, x1]) => (
        <rect key={x0} x={x0} y={-t / 2} width={x1 - x0} height={t} fill={height ? '#8f877d' : INK} />
      ))}
      {openings.map((o) => (
        <OpeningMark key={o.at} o={o} t={t} />
      ))}
    </g>
  )
}

function Dimension({ from, to, offset, label }: { from: Vec2; to: Vec2; offset: Vec2; label: string }) {
  const [x0, y0] = [from[0] + offset[0], from[1] + offset[1]]
  const [x1, y1] = [to[0] + offset[0], to[1] + offset[1]]
  const vertical = x0 === x1
  return (
    <g stroke={INK} strokeWidth={8} fill={INK}>
      <line x1={x0} y1={y0} x2={x1} y2={y1} />
      {[[x0, y0], [x1, y1]].map(([x, y]) => (
        <line key={`${x}${y}`} x1={x - 60} y1={y + 60} x2={x + 60} y2={y - 60} strokeWidth={14} />
      ))}
      <text
        x={(x0 + x1) / 2}
        y={(y0 + y1) / 2}
        dy={-70}
        stroke="none"
        fontSize={200}
        textAnchor="middle"
        transform={vertical ? `rotate(-90 ${(x0 + x1) / 2} ${(y0 + y1) / 2})` : undefined}
      >
        {label}
      </text>
    </g>
  )
}

export default function PlanDrawing({ utilities, ref }: { utilities: boolean; ref?: Ref<SVGSVGElement> }) {
  // footprints, low pieces first; things above 1.4 m (shelves, cabinets, mirrors) are dashed
  const pieces = FURNITURE.filter((p) => p.color !== 'rug').sort((p, q) => p.box[4] - q.box[4])

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
      fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    >
      <rect x={VIEW.x} y={VIEW.y} width={VIEW.w} height={VIEW.h} fill="#fff" />

      {ROOMS.map((r) => (
        <polygon key={r.name} points={r.outline.join(' ')} fill={FILL[r.floor]} />
      ))}

      {utilities &&
        pieces.map(({ box: [x0, z0, x1, z1, y0], color, shape }, i) => {
          const common = {
            fill: color === 'glass' || color === 'mirror' ? 'none' : '#fff',
            stroke: '#a59a8c',
            strokeWidth: 8,
            strokeDasharray: y0 > 1400 ? '40 30' : undefined,
          }
          return shape === 'box' ? (
            <rect key={i} x={x0} y={z0} width={x1 - x0} height={z1 - z0} rx={Math.min(30, (x1 - x0) / 4)} {...common} />
          ) : (
            <ellipse key={i} cx={(x0 + x1) / 2} cy={(z0 + z1) / 2} rx={(x1 - x0) / 2} ry={(z1 - z0) / 2} {...common} />
          )
        })}

      {WALLS.map((w, i) => (
        <WallMark key={i} {...w} />
      ))}

      {ROOMS.map((r) => {
        const [cx, cz] = r.label ?? centroid(r.outline)
        return (
          <text key={r.name} x={cx} y={cz} textAnchor="middle" fill={INK} stroke="#fff" strokeWidth={60} paintOrder="stroke">
            <tspan fontSize={260} fontWeight={600}>{r.name}</tspan>
            <tspan x={cx} dy={300} fontSize={190} fill="#7a7168">
              {(area(r.outline) / 1e6).toFixed(1)} m²
            </tspan>
          </text>
        )
      })}

      <Dimension from={[-250, -1300]} to={[11050, -1300]} offset={[0, -500]} label="11 300" />
      <Dimension from={[-250, -1300]} to={[-250, 10450]} offset={[-500, 0]} label="11 750" />

      <g fill={INK} fontSize={220}>
        <text x={7000} y={10000} fontWeight={600}>Elite — updated plan</text>
        <text x={7000} y={10300} fontSize={170} fill="#7a7168">
          kids' room · coding workspace · sliding glass door
        </text>
        <text x={7000} y={10520} fontSize={170} fill="#7a7168">
          storage + make-up room · shower + WC
        </text>
        <rect x={7000} y={10750} width={1000} height={60} />
        <rect x={8000} y={10750} width={1000} height={60} fill="none" stroke={INK} strokeWidth={10} />
        <text x={7000} y={11050} fontSize={160}>0</text>
        <text x={8000} y={11050} fontSize={160} textAnchor="middle">1</text>
        <text x={9000} y={11050} fontSize={160} textAnchor="middle">2 m</text>
      </g>
    </svg>
  )
}
