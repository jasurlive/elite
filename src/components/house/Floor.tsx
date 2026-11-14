import { useMemo } from 'react'
import { SLAB, type Room } from '../../lib/plan'
import { FLOOR_MAT } from './materials'
import { toShape } from './shape'

// room outline extruded into a thin slab, top face at y = 0
export default function Floor({ outline, floor }: Room) {
  const shape = useMemo(() => toShape(outline), [outline])

  return (
    <mesh material={FLOOR_MAT[floor]} rotation-x={-Math.PI / 2} position-y={-SLAB} receiveShadow>
      <extrudeGeometry args={[shape, { depth: SLAB, bevelEnabled: false }]} />
    </mesh>
  )
}
