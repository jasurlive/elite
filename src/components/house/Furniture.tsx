import { useMemo } from 'react'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { FURNITURE, type Piece } from '../../lib/furniture'
import { FURNITURE_MAT, GHOST } from './materials'

function Item({ box: [x0, z0, x1, z1, y0, y1], color, shape = 'box', radius = 14, ghost }: Piece & { ghost: boolean }) {
  const [w, h, d] = [x1 - x0, y1 - y0, z1 - z0]
  const r = Math.min(radius, Math.min(w, h, d) / 2 - 0.5)
  const rounded = useMemo(() => (shape === 'box' ? new RoundedBoxGeometry(w, h, d, 3, r) : null), [shape, w, h, d, r])
  const shadows = !ghost && color !== 'glass' && h > 10

  return (
    <mesh
      position={[(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]}
      scale={shape === 'sphere' ? [w, h, d] : 1}
      material={ghost ? GHOST : FURNITURE_MAT[color]}
      geometry={rounded ?? undefined}
      castShadow={shadows}
      receiveShadow
    >
      {shape === 'cyl' && <cylinderGeometry args={[Math.min(w, d) / 2, Math.min(w, d) / 2, h, 40]} />}
      {shape === 'sphere' && <sphereGeometry args={[0.5, 32, 24]} />}
    </mesh>
  )
}

// ghost: see-through, so the pipes and cables behind it stay visible
export default function Furniture({ ghost = false }: { ghost?: boolean }) {
  return FURNITURE.map((piece, i) => <Item key={i} {...piece} ghost={ghost} />)
}
