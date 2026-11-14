import { useMemo } from 'react'
import { ExtrudeGeometry, Path, Shape, Vector2, type Material } from 'three'
import { SLAB, SPAN, type Facade as FacadeDef, type Opening } from '../../lib/plan'
import { BRICK_MAT, MAT } from './materials'

const SKIN = 20 // brick skin over the wall face
const SURROUND = 125 // half a brick around every window and door
const PROUD = 25 // surrounds stand out of the skin
const PANEL_BAR = 75 // one course: the outlined panel under each window
const BAND = 120 // grey stringcourse at the top of the wall (the next slab)

type Pt = [x: number, y: number]
type Rect = [x0: number, x1: number, y0: number, y1: number]
type Piece = { geometry: ExtrudeGeometry; material: Material }

const corners = ([x0, x1, y0, y1]: Rect): Pt[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]
const points = (pts: Pt[]) => pts.map(([x, y]) => new Vector2(x, y))

// flat outline (+ holes) pushed out of the wall face by `depth`; UVs are wall mm, so bricks line up
function relief(outline: Pt[], holes: Rect[], depth: number, material: Material): Piece {
  const shape = new Shape(points(outline))
  shape.holes = holes.map((h) => new Path(points(corners(h))))
  return { geometry: new ExtrudeGeometry(shape, { depth, bevelEnabled: false }), material }
}

type Props = { facade: FacadeDef; length: number; t: number; height: number; openings: Opening[] }

// brick facade on one face of a wall, in the wall's frame (x along it, y up)
// red walls: buff surrounds + buff panels under the windows; buff walls (bays): red surrounds
export default function Facade({ facade, length, t, height, openings }: Props) {
  const pieces = useMemo(() => {
    const { brick, from = 0, to = length } = facade
    const main = BRICK_MAT[brick]
    const accent = BRICK_MAT[brick === 'red' ? 'buff' : 'red']
    const top = height - BAND
    const base = -SLAB
    const out: Piece[] = []

    const inside = openings.filter((o) => o.at > from && o.at < to)
    const windows = inside.filter((o) => o.kind === 'window')
    const doors = inside.filter((o) => o.kind !== 'window').sort((p, q) => p.at - q.at)

    // skin: notched up around doors (they reach the floor), holes around windows
    const outline: Pt[] = [[from, base]]
    for (const o of doors) {
      const x0 = o.at - o.width / 2 - SURROUND
      const x1 = o.at + o.width / 2 + SURROUND
      const y = SPAN[o.kind][1] + SURROUND
      outline.push([x0, base], [x0, y], [x1, y], [x1, base])
    }
    outline.push([to, base], [to, top], [from, top])
    const windowOuter = windows.map((o): Rect => {
      const [bottom, wtop] = SPAN.window
      return [o.at - o.width / 2 - SURROUND, o.at + o.width / 2 + SURROUND, bottom - SURROUND, wtop + SURROUND]
    })
    out.push(relief(outline, windowOuter, SKIN, main))

    // window surrounds: a ring of bricks
    windows.forEach((o, i) => {
      const [bottom, wtop] = SPAN.window
      out.push(relief(corners(windowOuter[i]), [[o.at - o.width / 2, o.at + o.width / 2, bottom, wtop]], SKIN + PROUD, accent))
    })

    // door surrounds: up both sides and over the top
    for (const o of doors) {
      const x0 = o.at - o.width / 2
      const x1 = o.at + o.width / 2
      const y = SPAN[o.kind][1]
      const S = SURROUND
      const u: Pt[] = [[x0 - S, base], [x0, base], [x0, y], [x1, y], [x1, base], [x1 + S, base], [x1 + S, y + S], [x0 - S, y + S]]
      out.push(relief(u, [], SKIN + PROUD, accent))
    }

    // outlined panel under each window (red walls only, as on the building)
    if (brick === 'red') {
      for (const [x0, x1, y0] of windowOuter) {
        const panel: Rect = [x0, x1, 150, y0 - 150]
        const hole: Rect = [x0 + PANEL_BAR * 1.5, x1 - PANEL_BAR * 1.5, 150 + PANEL_BAR, y0 - 150 - PANEL_BAR]
        out.push(relief(corners(panel), [hole], SKIN + 12, accent))
      }
    }

    // grey stringcourse along the top, running a little past the skin ends
    out.push(relief(corners([from, to, top, height + 6]), [], SKIN + 40, MAT.band))
    return out
  }, [facade, length, height, openings])

  // the skin starts on the outside face; a mirrored z puts it on the other face when side = -1
  return (
    <group position-z={(facade.side * t) / 2} scale-z={facade.side}>
      {pieces.map(({ geometry, material }, i) => (
        <mesh key={i} geometry={geometry} material={material} castShadow receiveShadow />
      ))}
    </group>
  )
}
