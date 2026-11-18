import { Canvas } from '@react-three/fiber'
import { NeutralToneMapping } from 'three'
import '../css/home.css'
import Scene from '../components/house/Scene'
import { useHouse } from '../hooks/LOCAL/useHouse'
import { useTranslation } from 'react-i18next'
import { usePlace } from '../i18n'

// the 3D house; camera view + layer are controlled from the navbar
export default function Home() {
  const { view, layer } = useHouse()
  const { t } = useTranslation()
  const place = usePlace()

  return (
    <div className="home">
      <Canvas
        className="home-canvas"
        shadows
        dpr={[1, 2]}
        camera={{ position: [11, 10.5, 13], fov: 40 }}
        gl={{ toneMapping: NeutralToneMapping }}
      >
        <Scene view={view} layer={layer} />
      </Canvas>

      <p className="home-caption">
        <span className="home-title">Elite</span> {place(view.label)} · {t(`layers.${layer}`)}
      </p>
    </div>
  )
}
