import type { Ref } from 'react'
import { ROOMS, WALLS, type Opening, type Room, type Vec2, type Vec3, type WallDef } from '../lib/plan'
import { FURNITURE } from '../lib/furniture'
import { BOARD, BOXES, CABLES, DEVICES, PIPES, RISERS, SERVICE_COLOR } from '../lib/services'
import type { Layer } from '../hooks/LOCAL/useHouse'
import { useTranslation } from 'react-i18next'
import { usePlace } from '../i18n'
import type { Messages } from '../i18n/en'

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
    // bi-parting: both leaves on the +y face, arrows from the centre out to each side
    const leaf = o.width / 2 + 40
    const y = t / 2 + 10
    return (
      <g stroke={INK} strokeWidth={10} fill="#fff">
        <rect x={o.at - leaf} y={y} width={leaf} height={30} />
        <rect x={o.at} y={y} width={leaf} height={30} />
        {[-1, 1].map((s) => (
          <path key={s} d={`M ${o.at + s * 100} ${y + 110} h ${s * 450} m ${-s * 90} -50 l ${s * 90} 50 l ${-s * 90} 50`} fill="none" strokeWidth={14} />
        ))}
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

// room with a ceiling light inside it (its bounding box)
const lit = (r: Room) => {
  const xs = r.outline.map(([x]) => x)
  const zs = r.outline.map(([, z]) => z)
  return DEVICES.some(({ kind, at: [x, , z] }) => kind === 'light' && x > Math.min(...xs) && x < Math.max(...xs) && z > Math.min(...zs) && z < Math.max(...zs))
}

const line = (pts: Vec3[]) => pts.map(([x, , z]) => `${x},${z}`).join(' ')

// pipes: drains under, hot + cold on top; outlets = small rings, risers = crossed circles
function PlumbingMarks() {
  const ordered = [...PIPES].sort((a, b) => (a.kind === 'drain' ? -1 : 0) - (b.kind === 'drain' ? -1 : 0))
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {ordered.map((p, i) => (
        <polyline key={i} points={line(p.points)} stroke={SERVICE_COLOR[p.kind]} strokeWidth={p.kind === 'drain' ? Math.max(40, p.r) : 26} />
      ))}
      {PIPES.filter((p) => p.outlet).map((p, i) => {
        const [x, , z] = p.points[p.points.length - 1]
        return <circle key={i} cx={x} cy={z} r={45} fill="#fff" stroke={SERVICE_COLOR[p.kind]} strokeWidth={18} />
      })}
      {RISERS.map(({ room, drain: [x, z] }) => (
        <g key={room} stroke={INK} strokeWidth={14}>
          <circle cx={x} cy={z} r={110} fill="#fff" />
          <path d={`M ${x - 78} ${z - 78} L ${x + 78} ${z + 78} M ${x - 78} ${z + 78} L ${x + 78} ${z - 78}`} />
        </g>
      ))}
    </g>
  )
}

// cables + symbols: socket = half-filled circle, switch = circle with a lever, light = crossed circle
function ElectricMarks() {
  const [bx, , bz] = BOARD.at
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {CABLES.map((c, i) => (
        <polyline key={i} points={line(c.points)} fill="none" stroke={SERVICE_COLOR[c.kind]} strokeWidth={c.kind === 'power' ? 22 : 16} strokeDasharray={c.kind === 'light' ? '70 40' : undefined} />
      ))}
      <rect x={bx} y={bz - BOARD.size[2] / 2} width={140} height={BOARD.size[2]} fill={INK} />
      {BOXES.map(([x, , z], i) => (
        <circle key={i} cx={x} cy={z} r={55} fill={INK} />
      ))}
      {DEVICES.map(({ kind, at: [x, , z] }, i) => (
        <DeviceMark key={i} kind={kind} x={x} z={z} />
      ))}
    </g>
  )
}

function DeviceMark({ kind, x, z }: { kind: 'socket' | 'switch' | 'light'; x: number; z: number }) {
  if (kind === 'light') {
    const d = 110
    return (
      <g stroke={INK} strokeWidth={14} fill="#fff">
        <circle cx={x} cy={z} r={155} />
        <path d={`M ${x - d} ${z - d} L ${x + d} ${z + d} M ${x - d} ${z + d} L ${x + d} ${z - d}`} />
      </g>
    )
  }
  if (kind === 'socket') {
    return (
      <g stroke={SERVICE_COLOR.power} strokeWidth={14}>
        <circle cx={x} cy={z} r={80} fill="#fff" />
        <path d={`M ${x - 80} ${z} A 80 80 0 0 1 ${x + 80} ${z} Z`} fill={SERVICE_COLOR.power} />
      </g>
    )
  }
  return (
    <g stroke={INK} strokeWidth={14}>
      <circle cx={x} cy={z} r={65} fill="#fff" />
      <line x1={x + 45} y1={z - 45} x2={x + 150} y2={z - 150} />
    </g>
  )
}

type Key = `services.${keyof Messages['services']}`
const LEGEND: Record<'plumbing' | 'electric', [mark: 'line' | 'dash' | 'ring' | 'riser' | 'socket' | 'switch' | 'light' | 'board' | 'box', color: string, key: Key][]> = {
  plumbing: [
    ['line', SERVICE_COLOR.cold, 'services.cold'],
    ['line', SERVICE_COLOR.hot, 'services.hot'],
    ['line', SERVICE_COLOR.drain, 'services.drain'],
    ['ring', SERVICE_COLOR.cold, 'services.outlet'],
    ['riser', INK, 'services.riser'],
  ],
  electric: [
    ['line', SERVICE_COLOR.power, 'services.power'],
    ['dash', SERVICE_COLOR.light, 'services.lighting'],
    ['board', INK, 'services.board'],
    ['box', INK, 'services.box'],
    ['socket', SERVICE_COLOR.power, 'services.socket'],
    ['switch', INK, 'services.switch'],
    ['light', INK, 'services.light'],
  ],
}

function Legend({ layer }: { layer: 'plumbing' | 'electric' }) {
  const { t } = useTranslation()
  const [x, y] = [-450, 6900]
  return (
    <g fontSize={170} fill={INK}>
      <text x={x} y={y} fontWeight={600} fontSize={220}>{t(`layers.${layer}`)}</text>
      {LEGEND[layer].map(([mark, color, key], i) => {
        const cy = y + 420 + i * 360
        const cx = x + 160
        return (
          <g key={key}>
            {(mark === 'line' || mark === 'dash') && (
              <line x1={x} x2={x + 320} y1={cy} y2={cy} stroke={color} strokeWidth={mark === 'dash' ? 16 : 26} strokeDasharray={mark === 'dash' ? '70 40' : undefined} />
            )}
            {mark === 'ring' && <circle cx={cx} cy={cy} r={45} fill="#fff" stroke={color} strokeWidth={18} />}
            {mark === 'riser' && (
              <g stroke={INK} strokeWidth={14}>
                <circle cx={cx} cy={cy} r={110} fill="#fff" />
                <path d={`M ${cx - 78} ${cy - 78} L ${cx + 78} ${cy + 78} M ${cx - 78} ${cy + 78} L ${cx + 78} ${cy - 78}`} />
              </g>
            )}
            {mark === 'board' && <rect x={cx - 70} y={cy - 110} width={140} height={220} fill={INK} />}
            {mark === 'box' && <circle cx={cx} cy={cy} r={55} fill={INK} />}
            {(mark === 'socket' || mark === 'switch' || mark === 'light') && <DeviceMark kind={mark} x={cx} z={cy} />}
            <text x={x + 430} y={cy} dy={60}>{t(key)}</text>
          </g>
        )
      })}
    </g>
  )
}

export default function PlanDrawing({ layer, ref }: { layer: Layer; ref?: Ref<SVGSVGElement> }) {
  const services = layer === 'plumbing' || layer === 'electric'
  // footprints, low pieces first; things above 1.4 m (shelves, cabinets, mirrors) are dashed
  const pieces = FURNITURE.filter((p) => p.color !== 'rug').sort((p, q) => p.box[4] - q.box[4])
  const { t } = useTranslation()
  const place = usePlace()

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

      {layer !== 'empty' &&
        pieces.map(({ box: [x0, z0, x1, z1, y0], color, shape }, i) => {
          const common = {
            fill: color === 'glass' || color === 'mirror' ? 'none' : '#fff',
            stroke: services ? '#ddd6cc' : '#a59a8c',
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

      {layer === 'plumbing' && <PlumbingMarks />}
      {layer === 'electric' && <ElectricMarks />}
      {services && <Legend layer={layer} />}

      {ROOMS.map((r) => {
        const [cx, c] = r.label ?? centroid(r.outline)
        const cz = layer === 'electric' && lit(r) ? c - 550 : c // lift the name off the ceiling light in the middle
        return (
          <text key={r.name} x={cx} y={cz} textAnchor="middle" fill={INK} stroke="#fff" strokeWidth={60} paintOrder="stroke">
            <tspan fontSize={260} fontWeight={600}>{place(r.name)}</tspan>
            <tspan x={cx} dy={300} fontSize={190} fill="#7a7168">
              {(area(r.outline) / 1e6).toFixed(1)} {t('plan.m')}²
            </tspan>
          </text>
        )
      })}

      <Dimension from={[-250, -1300]} to={[11050, -1300]} offset={[0, -500]} label="11 300" />
      <Dimension from={[-250, -1300]} to={[-250, 10450]} offset={[-500, 0]} label="11 750" />

      <g fill={INK} fontSize={220}>
        <text x={7000} y={10000} fontWeight={600}>{t('plan.title')}</text>
        <text x={7000} y={10300} fontSize={170} fill="#7a7168">
          {t('plan.notes1')}
        </text>
        <text x={7000} y={10520} fontSize={170} fill="#7a7168">
          {t('plan.notes2')}
        </text>
        <rect x={7000} y={10750} width={1000} height={60} />
        <rect x={8000} y={10750} width={1000} height={60} fill="none" stroke={INK} strokeWidth={10} />
        <text x={7000} y={11050} fontSize={160}>0</text>
        <text x={8000} y={11050} fontSize={160} textAnchor="middle">1</text>
        <text x={9000} y={11050} fontSize={160} textAnchor="middle">2 {t('plan.m')}</text>
      </g>
    </svg>
  )
}
