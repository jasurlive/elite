import { MAT } from './materials'

// wrought-iron balcony railing along x (0..length), like the French balconies on the building:
// square balusters, and a band of rings under the handrail
const RAIL_TOP = 1000
const MID = 810 // rail under the ring band
const BASE = 90 // bottom rail
const PITCH = 110 // baluster spacing
const RING_TUBE = 7

function Bar({ x, y, size }: { x: [number, number]; y: [number, number]; size: number }) {
  return (
    <mesh material={MAT.iron} position={[(x[0] + x[1]) / 2, (y[0] + y[1]) / 2, 0]} castShadow>
      <boxGeometry args={[x[1] - x[0], y[1] - y[0], size]} />
    </mesh>
  )
}

export default function Railing({ length }: { length: number }) {
  const balusters = Math.max(1, Math.round(length / PITCH))
  const step = length / balusters
  const bandY = (MID + RAIL_TOP - 30) / 2
  const bandH = RAIL_TOP - 30 - MID - 25
  const rings = Math.max(1, Math.round(length / (bandH + 10)))
  const ringPitch = length / rings
  const R = Math.min(bandH, ringPitch) / 2 - RING_TUBE

  return (
    <>
      {/* end posts, handrail, mid rail, bottom rail */}
      <Bar x={[0, 40]} y={[0, RAIL_TOP]} size={40} />
      <Bar x={[length - 40, length]} y={[0, RAIL_TOP]} size={40} />
      <Bar x={[0, length]} y={[RAIL_TOP - 30, RAIL_TOP]} size={55} />
      <Bar x={[0, length]} y={[MID, MID + 25]} size={22} />
      <Bar x={[0, length]} y={[BASE - 25, BASE]} size={28} />

      {Array.from({ length: balusters - 1 }, (_, i) => (
        <Bar key={i} x={[(i + 1) * step - 7, (i + 1) * step + 7]} y={[BASE, MID]} size={14} />
      ))}

      {Array.from({ length: rings }, (_, i) => (
        <mesh key={i} material={MAT.iron} position={[(i + 0.5) * ringPitch, bandY + 12, 0]} castShadow>
          <torusGeometry args={[R, RING_TUBE, 8, 28]} />
        </mesh>
      ))}
    </>
  )
}
