import { Canvas } from '@react-three/fiber'
import { NeutralToneMapping } from 'three'
import '../css/home.css'
import Scene from '../components/house/Scene'
import { useHouse } from '../hooks/LOCAL/useHouse'

// the 3D house; camera view + utilities are controlled from the navbar
export default function Home() {
  const { view, utilities } = useHouse()

  return (
    <div className="home">
      <Canvas
        className="home-canvas"
        shadows
        dpr={[1, 2]}
        camera={{ position: [11, 10.5, 13], fov: 40 }}
        gl={{ toneMapping: NeutralToneMapping }}
      >
        <Scene view={view} utilities={utilities} />
      </Canvas>

      <p className="home-caption">
        <span className="home-title">Elite</span> {view.label} · {utilities ? 'with utilities' : 'no utilities'}
      </p>
      <p className="home-hint">
        {'room' in view
          ? 'Drag to look around · Scroll or W A S D to walk · V views · U utilities'
          : 'Drag to orbit · Scroll to zoom · Right-drag to pan · V views · U utilities'}
      </p>
    </div>
  )
}
