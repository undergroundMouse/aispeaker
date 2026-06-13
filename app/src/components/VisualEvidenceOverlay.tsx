import { useEffect, useRef } from 'react'
import type { VisionRegion } from '../types'

interface VisualEvidenceOverlayProps {
  regions: VisionRegion[]
  visible: boolean
}

export function VisualEvidenceOverlay({ regions, visible }: VisualEvidenceOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || !visible || regions.length === 0) {
      return
    }

    const draw = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      if (width === 0 || height === 0) {
        return
      }

      const context = canvas.getContext('2d')
      if (!context) {
        return
      }

      const devicePixelRatio = window.devicePixelRatio || 1
      canvas.width = Math.floor(width * devicePixelRatio)
      canvas.height = Math.floor(height * devicePixelRatio)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
      context.clearRect(0, 0, width, height)

      for (const region of regions) {
        const x = region.x * width
        const y = region.y * height
        const boxWidth = region.width * width
        const boxHeight = region.height * height

        context.strokeStyle = '#38bdf8'
        context.lineWidth = 3
        context.strokeRect(x, y, boxWidth, boxHeight)

        context.fillStyle = 'rgba(56, 189, 248, 0.12)'
        context.fillRect(x, y, boxWidth, boxHeight)

        if (region.label) {
          context.font = '600 14px sans-serif'
          context.fillStyle = '#e0f2fe'
          context.fillText(region.label, x + 8, Math.max(18, y + 18))
        }
      }
    }

    draw()

    const observer = new ResizeObserver(draw)
    observer.observe(container)
    return () => observer.disconnect()
  }, [regions, visible])

  if (!visible || regions.length === 0) {
    return null
  }

  return (
    <div ref={containerRef} className="evidence-overlay">
      <canvas ref={canvasRef} className="evidence-canvas" />
    </div>
  )
}
