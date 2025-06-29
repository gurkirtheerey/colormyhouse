import React, { useRef, useState } from 'react'
import { Stage, Layer, Image as KonvaImage } from 'react-konva'
import Konva from 'konva'
import { Tool } from '../types'

interface CanvasEditorProps {
  imageUrl: string
  width: number
  height: number
  activeTool?: Tool
  onSelectionChange?: (selection: unknown) => void
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  imageUrl,
  width,
  height,
}) => {
  const stageRef = useRef<Konva.Stage>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)

  React.useEffect(() => {
    const img = new window.Image()
    img.src = imageUrl
    img.onload = () => {
      setImage(img)
    }
  }, [imageUrl])

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    
    const stage = stageRef.current
    if (!stage) return

    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1
    setZoom(newScale)

    stage.scale({ x: newScale, y: newScale })

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    }
    stage.position(newPos)
    stage.batchDraw()
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onWheel={handleWheel}
        className="bg-gray-100"
      >
        <Layer>
          {image && (
            <KonvaImage
              image={image}
              width={width}
              height={height}
            />
          )}
        </Layer>
      </Stage>
      <div className="absolute bottom-4 right-4 bg-white px-3 py-1 rounded shadow">
        <span className="text-sm text-gray-600">
          Zoom: {Math.round(zoom * 100)}%
        </span>
      </div>
    </div>
  )
}