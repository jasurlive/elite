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
    </div>
  )
}
