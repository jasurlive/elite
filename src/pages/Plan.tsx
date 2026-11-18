import { useRef, useState } from 'react'
import '../css/plan.css'
import original from '../assets/elite.jpg'
import PlanDrawing from '../components/PlanDrawing'
import { useHouse } from '../hooks/LOCAL/useHouse'
import { useTranslation } from 'react-i18next'

// svg → png file, so the updated plan can be shared like the original
function downloadPng(svg: SVGSVGElement) {
  const { width, height } = svg.viewBox.baseVal
  const scale = 3000 / width
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = width * scale
    canvas.height = height * scale
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    const link = document.createElement('a')
    link.download = 'elite-plan.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`
}

export default function Plan() {
  const { layer } = useHouse()
  const { t } = useTranslation()
  const [tab, setTab] = useState<'updated' | 'original'>('updated')
  const svg = useRef<SVGSVGElement>(null)

  return (
    <div className="plan">
      <header className="plan-head">
        <div className="plan-tabs" role="tablist">
          {(['updated', 'original'] as const).map((k) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className="plan-tab" onClick={() => setTab(k)}>
              {t(`plan.${k}`)}
            </button>
          ))}
        </div>

        {tab === 'updated' ? (
          <button type="button" className="page-button" onClick={() => svg.current && downloadPng(svg.current)}>
            {t('plan.download')}
          </button>
        ) : (
          <a className="page-button" href={original} target="_blank" rel="noreferrer">
            {t('plan.openFull')}
          </a>
        )}
      </header>

      <div className="plan-sheet">
        {tab === 'updated' ? (
          <PlanDrawing ref={svg} layer={layer} />
        ) : (
          <img src={original} alt={t('plan.originalAlt')} />
        )}
      </div>
    </div>
  )
}
