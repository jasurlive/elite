import { SLAB, SPAN, WALL_H, type WallDef } from '../../lib/plan'
import { MAT } from './materials'
import Opening from './Opening'

type Piece = [x0: number, x1: number, y0: number, y1: number]

const SKIRT_H = 80
const CAP = 6

// a straight wall from a to b in its own frame: x along the wall, z across it
// openings cut the wall into solid pieces; frames, glass and leaves come from <Opening>
export default function Wall({ a, b, t, height = WALL_H, openings = [] }: WallDef) {
  const dx = b[0] - a[0]
  const dz = b[1] - a[1]
  const length = Math.hypot(dx, dz)

  const pieces: Piece[] = []
  let cursor = 0
  for (const o of openings) {
    const x0 = o.at - o.width / 2
    const x1 = o.at + o.width / 2
    const [bottom, top] = SPAN[o.kind]
    pieces.push([cursor, x0, -SLAB, height], [x0, x1, -SLAB, bottom], [x0, x1, top, height])
    cursor = x1
  }
  pieces.push([cursor, length, -SLAB, height])

  const solid = pieces.filter(([x0, x1, y0, y1]) => x1 - x0 > 1 && y1 - y0 > 1)
  const full = solid.filter(([, , y0, y1]) => y0 < 0 && y1 === height)

  return (
    <group position={[a[0], 0, a[1]]} rotation-y={-Math.atan2(dz, dx)}>
      {solid.map(([x0, x1, y0, y1], i) => (
        <mesh key={i} material={MAT.wall} position={[(x0 + x1) / 2, (y0 + y1) / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[x1 - x0, y1 - y0, t]} />
        </mesh>
      ))}

      {/* section cut on top of every wall that reaches full height */}
      {solid
        .filter(([, , , y1]) => y1 === height)
        .map(([x0, x1], i) => (
          <mesh key={i} material={MAT.cap} position={[(x0 + x1) / 2, height + CAP / 2, 0]}>
            <boxGeometry args={[x1 - x0, CAP, t]} />
          </mesh>
        ))}

      {height === WALL_H &&
        full.map(([x0, x1], i) => (
          <mesh key={i} material={MAT.trim} position={[(x0 + x1) / 2, SKIRT_H / 2, 0]} receiveShadow>
            <boxGeometry args={[x1 - x0, SKIRT_H, t + 24]} />
          </mesh>
        ))}

      {openings.map((o, i) => (
        <Opening key={i} opening={o} t={t} />
      ))}
    </group>
  )
}
