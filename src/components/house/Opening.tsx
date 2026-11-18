import type { Material } from 'three'
import { SPAN, type Opening as OpeningDef } from '../../lib/plan'
import { MAT } from './materials'

const FRAME = 50
const LEAF = 40
const OPEN_ANGLE = (75 * Math.PI) / 180

type BoxProps = { x: [number, number]; y: [number, number]; depth: number; z?: number; material: Material; shadow?: boolean }

// box from x0..x1, y0..y1 in the wall frame
function Box({ x: [x0, x1], y: [y0, y1], depth, z = 0, material, shadow = true }: BoxProps) {
  return (
    <mesh material={material} position={[(x0 + x1) / 2, (y0 + y1) / 2, z]} castShadow={shadow} receiveShadow>
      <boxGeometry args={[x1 - x0, y1 - y0, depth]} />
    </mesh>
  )
}

// four bars around a rectangle + glass inside
function Glazing({ x: [x0, x1], y: [y0, y1], bar, depth, z = 0, material }: Omit<BoxProps, 'shadow'> & { bar: number }) {
  return (
    <>
      <Box x={[x0, x0 + bar]} y={[y0, y1]} depth={depth} z={z} material={material} />
      <Box x={[x1 - bar, x1]} y={[y0, y1]} depth={depth} z={z} material={material} />
      <Box x={[x0, x1]} y={[y1 - bar, y1]} depth={depth} z={z} material={material} />
      <Box x={[x0, x1]} y={[y0, y0 + bar]} depth={depth} z={z} material={material} />
      <Box x={[x0 + bar, x1 - bar]} y={[y0 + bar, y1 - bar]} depth={8} z={z} material={MAT.glass} shadow={false} />
    </>
  )
}

export default function Opening({ opening: o, t }: { opening: OpeningDef; t: number }) {
  const x0 = o.at - o.width / 2
  const x1 = o.at + o.width / 2
  const [bottom, top] = SPAN[o.kind]

  if (o.kind === 'window') {
    const mid = (x0 + x1) / 2
    return (
      <>
        <Glazing x={[x0, mid]} y={[bottom, top]} bar={FRAME} depth={70} material={MAT.steel} />
        <Glazing x={[mid, x1]} y={[bottom, top]} bar={FRAME} depth={70} material={MAT.steel} />
        <Box x={[x0 - 30, x1 + 30]} y={[bottom - 30, bottom]} depth={t + 60} material={MAT.trim} />
      </>
    )
  }

  if (o.kind === 'slide') {
    // bi-parting: two glass leaves on one track on the wall's +z face, opening from the centre to both sides (shown half open)
    // the rail is exactly the leaves' travel: fully open, each leaf parks beside the opening (at ± width)
    const leaf = o.width / 2 + 40
    const slid = leaf * 0.45
    const face = t / 2 + 25
    return (
      <>
        <Box x={[x0, x1]} y={[top - 40, top]} depth={t} material={MAT.steel} />
        <Box x={[o.at - o.width, o.at + o.width]} y={[top, top + 50]} depth={40} z={face} material={MAT.steel} />
        <Glazing x={[o.at - leaf - slid, o.at - slid]} y={[10, top]} bar={45} depth={35} z={face} material={MAT.steel} />
        <Glazing x={[o.at + slid, o.at + leaf + slid]} y={[10, top]} bar={45} depth={35} z={face} material={MAT.steel} />
      </>
    )
  }

  // hinged door: frame (architrave both sides) + leaf standing open towards o.side
  const leafW = o.width - 2 * FRAME - 10
  const leafH = top - FRAME - 10
  const dir = o.hinge === 'start' ? 1 : -1
  const hingeX = o.hinge === 'start' ? x0 + FRAME + 5 : x1 - FRAME - 5
  const openAngle = -Math.atan2(o.side * Math.sin(OPEN_ANGLE), dir * Math.cos(OPEN_ANGLE))
  // the leaf face that looks into the room when the door is closed
  const inner = -o.side * dir

  return (
    <>
      <Box x={[x0, x0 + FRAME]} y={[0, top]} depth={t + 20} material={MAT.trim} />
      <Box x={[x1 - FRAME, x1]} y={[0, top]} depth={t + 20} material={MAT.trim} />
      <Box x={[x0, x1]} y={[top - FRAME, top]} depth={t + 20} material={MAT.trim} />

      <group position={[hingeX, 0, o.side * (t / 2 - LEAF)]} rotation-y={openAngle}>
        {o.glazed ? (
          <Glazing x={[0, leafW]} y={[10, 10 + leafH]} bar={80} depth={LEAF} material={MAT.trim} />
        ) : (
          <Box x={[0, leafW]} y={[10, 10 + leafH]} depth={LEAF} material={MAT.trim} />
        )}
        {o.mirror && (
          <Box x={[90, leafW - 90]} y={[250, 1950]} depth={4} z={inner * (LEAF / 2 + 2)} material={MAT.mirror} shadow={false} />
        )}
        {[-1, 1].map((s) => (
          <Box key={s} x={[leafW - 190, leafW - 60]} y={[1000, 1018]} depth={18} z={s * 38} material={MAT.chrome} />
        ))}
      </group>
    </>
  )
}
