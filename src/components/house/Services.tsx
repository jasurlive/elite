import { Quaternion, Vector3, type MeshStandardMaterial } from 'three'
import type { Vec3 } from '../../lib/plan'
import { BOARD, BOXES, CABLES, DEVICES, PIPES, type Device } from '../../lib/services'
import type { Layer } from '../../hooks/LOCAL/useHouse'
import { SERVICE_MAT } from './materials'

const UP = new Vector3(0, 1, 0)

// a polyline as round tubes with a ball on every bend, so elbows look continuous
function Tube({ points, r, material }: { points: Vec3[]; r: number; material: MeshStandardMaterial }) {
  return (
    <>
      {points.slice(1).map((b, i) => {
        const a = new Vector3(...points[i])
        const dir = new Vector3(...b).sub(a)
        const len = dir.length()
        const mid = a.addScaledVector(dir, 0.5)
        const q = new Quaternion().setFromUnitVectors(UP, dir.normalize())
        return (
          <mesh key={i} position={mid} quaternion={q} material={material}>
            <cylinderGeometry args={[r, r, len, 16]} />
          </mesh>
        )
      })}
      {points.slice(1, -1).map((p, i) => (
        <mesh key={`j${i}`} position={p} material={material}>
          <sphereGeometry args={[r, 16, 12]} />
        </mesh>
      ))}
    </>
  )
}

// socket / switch plate on a wall, or a flat round fitting on the ceiling
function Point({ kind, at, face }: Device) {
  if (kind === 'light') {
    return (
      <mesh position={at} material={SERVICE_MAT.fitting}>
        <cylinderGeometry args={[130, 130, 20, 40]} />
      </mesh>
    )
  }
  const turn = face === 'e' || face === 'w' ? Math.PI / 2 : 0
  const out = face === 'e' || face === 's' ? 1 : -1 // which way the plate's front faces along its normal
  return (
    <group position={at} rotation-y={turn}>
      <mesh material={SERVICE_MAT.plate}>
        <boxGeometry args={[86, 86, 24]} />
      </mesh>
      {kind === 'socket' ? (
        <mesh position-z={out * 13} rotation-x={Math.PI / 2} material={SERVICE_MAT.power}>
          <cylinderGeometry args={[26, 26, 4, 24]} />
        </mesh>
      ) : (
        <mesh position-z={out * 13} material={SERVICE_MAT.light}>
          <boxGeometry args={[40, 56, 6]} />
        </mesh>
      )}
    </group>
  )
}

export default function Services({ layer }: { layer: Layer }) {
  if (layer === 'plumbing') {
    return PIPES.map((p, i) => (
      <group key={i}>
        <Tube points={p.points} r={p.r} material={SERVICE_MAT[p.kind]} />
        {p.outlet && (
          <mesh position={p.points[p.points.length - 1]} material={SERVICE_MAT.valve}>
            <sphereGeometry args={[p.r + 14, 16, 12]} />
          </mesh>
        )}
      </group>
    ))
  }

  if (layer !== 'electric') return null
  const [bx, by, bz] = BOARD.at
  const [d, h, w] = BOARD.size
  return (
    <>
      <mesh position={[bx + d / 2, by + h / 2, bz]} material={SERVICE_MAT.board}>
        <boxGeometry args={[d, h, w]} />
      </mesh>
      {CABLES.map((c, i) => (
        <Tube key={i} points={c.points} r={c.kind === 'power' ? 12 : 9} material={SERVICE_MAT[c.kind]} />
      ))}
      {BOXES.map((p, i) => (
        <mesh key={i} position={p} material={SERVICE_MAT.board}>
          <cylinderGeometry args={[45, 45, 40, 24]} />
        </mesh>
      ))}
      {DEVICES.map((dev, i) => (
        <Point key={i} {...dev} />
      ))}
    </>
  )
}
