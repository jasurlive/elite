import { useMemo } from 'react'
import { Environment, Lightformer } from '@react-three/drei'
import { CENTER, ROOMS, WALL_H, WALLS, type View } from '../../lib/plan'
import Camera from './Camera'
import Floor from './Floor'
import Wall from './Wall'
import Furniture from './Furniture'
import Services from './Services'
import type { Layer } from '../../hooks/LOCAL/useHouse'
import { MAT } from './materials'
import { toShape } from './shape'

const indoor = ROOMS.filter((r) => r.name !== 'Balcony')

// invisible roof: you look straight through it, but it still blocks the sun,
// so daylight only gets in through windows and glass doors
function ShadowRoof() {
  const shapes = useMemo(() => indoor.map((r) => toShape(r.outline)), [])
  return shapes.map((shape, i) => (
    <mesh key={i} rotation-x={-Math.PI / 2} position-y={WALL_H} castShadow>
      <extrudeGeometry args={[shape, { depth: 40, bevelEnabled: false }]} />
      <meshBasicMaterial colorWrite={false} depthWrite={false} />
    </mesh>
  ))
}

// real ceilings for the walk-in views; they face down, so from outside you still see in
function Ceilings() {
  const shapes = useMemo(() => indoor.map((r) => toShape(r.outline, true)), [])
  return shapes.map((shape, i) => (
    <mesh key={i} material={MAT.ceiling} rotation-x={Math.PI / 2} position-y={WALL_H}>
      <shapeGeometry args={[shape]} />
    </mesh>
  ))
}

type Props = { view: View; layer: Layer }

export default function Scene({ view, layer }: Props) {
  return (
    <>
      <color attach="background" args={['#f4f1ec']} />

      <hemisphereLight args={['#fffaf2', '#e4dacb', 1.9]} />
      {/* low sun from the kitchen side: through the kitchen windows and the sliding door */}
      <directionalLight
        position={[3, 6, -9]}
        intensity={3.2}
        color="#fff3e0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={11}
        shadow-camera-bottom={-11}
      />
      {/* soft studio panels: fill light + something for the mirrors to reflect */}
      <Environment resolution={128} environmentIntensity={0.5}>
        <color attach="background" args={['#9d968c']} />
        <Lightformer intensity={1.6} position={[0, 8, 0]} rotation-x={Math.PI / 2} scale={[16, 16, 1]} color="#fff8ee" />
        <Lightformer intensity={0.8} position={[0, 2, -12]} scale={[24, 5, 1]} />
        <Lightformer intensity={0.5} position={[12, 2, 0]} rotation-y={-Math.PI / 2} scale={[24, 5, 1]} />
      </Environment>

      <Camera view={view} />

      {/* model is drawn in mm, scaled to metres */}
      <group scale={0.001} position={[-CENTER[0] / 1000, 0, -CENTER[1] / 1000]}>
        {ROOMS.map((room) => <Floor key={room.name} {...room} />)}
        {WALLS.map((wall, i) => <Wall key={i} {...wall} />)}
        <ShadowRoof />
        {'room' in view && <Ceilings />}
        {layer !== 'empty' && <Furniture ghost={layer !== 'furniture'} />}
        <Services layer={layer} />
      </group>
    </>
  )
}
