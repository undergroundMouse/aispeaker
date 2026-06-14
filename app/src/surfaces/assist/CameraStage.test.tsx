// @vitest-environment jsdom
import { render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CameraStage } from './CameraStage'

describe('CameraStage', () => {
  it('applies selection animation class when a region is selected', async () => {
    const { container } = render(
      <CameraStage
        language="zh"
        videoRef={{ current: null }}
        cameraStream={null}
        mediaStatus="ready"
        cameraStatus="ready"
        activeVisualEvidence={null}
        selectedObjectRegion={{ x: 0.1, y: 0.2, width: 0.3, height: 0.4 }}
        interactionFeedback={{ kind: 'none' }}
        onSelectFromPointer={() => undefined}
      />,
    )

    await waitFor(() => {
      expect(container.querySelector('.selection-box--animated')).toBeTruthy()
    })
  })

  it('binds the camera stream when the stage mounts', () => {
    const stream = {} as MediaStream
    const videoRef = { current: null as HTMLVideoElement | null }
    const { container } = render(
      <CameraStage
        language="zh"
        videoRef={videoRef}
        cameraStream={stream}
        mediaStatus="ready"
        cameraStatus="ready"
        activeVisualEvidence={null}
        selectedObjectRegion={null}
        interactionFeedback={{ kind: 'none' }}
        onSelectFromPointer={() => undefined}
      />,
    )

    const video = container.querySelector('video') as HTMLVideoElement
    expect(video.srcObject).toBe(stream)
  })
})
