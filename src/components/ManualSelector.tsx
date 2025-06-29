import React, { useRef, useState, useCallback } from 'react'
import { Stage, Layer, Image as KonvaImage, Line } from 'react-konva'
import Konva from 'konva'

interface ManualSelectorProps {
  imageUrl: string
  imageWidth: number
  imageHeight: number
  onSelectionComplete: (selection: { points: number[], classId: number }) => void
  selectedTool: 'brush' | 'eraser' | 'polygon'
  brushSize: number
  selectedClass: number
}

export const ManualSelector: React.FC<ManualSelectorProps> = ({
  imageUrl,
  imageWidth,
  imageHeight,
  onSelectionComplete,
  selectedTool,
  brushSize,
  selectedClass
}) => {
  const stageRef = useRef<Konva.Stage>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<number[]>([])
  const [paths, setPaths] = useState<Array<{points: number[], tool: string, size: number, classId: number}>>([])
  const [polygonPoints, setPolygonPoints] = useState<number[]>([])
  
  const containerWidth = 800
  const containerHeight = 600
  const scale = Math.min(containerWidth / imageWidth, containerHeight / imageHeight)

  // Load the original image
  React.useEffect(() => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = imageUrl
    img.onload = () => {
      setImage(img)
    }
  }, [imageUrl])

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (selectedTool === 'polygon') return
    
    setIsDrawing(true)
    const pos = e.target.getStage()?.getPointerPosition()
    if (pos) {
      setCurrentPath([pos.x / scale, pos.y / scale])
    }
  }, [selectedTool, scale])

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || selectedTool === 'polygon') return

    const stage = e.target.getStage()
    const point = stage?.getPointerPosition()
    if (point) {
      setCurrentPath(prev => [...prev, point.x / scale, point.y / scale])
    }
  }, [isDrawing, selectedTool, scale])

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return
    
    setIsDrawing(false)
    if (currentPath.length > 4) { // At least 2 points
      const newPath = {
        points: currentPath,
        tool: selectedTool,
        size: brushSize,
        classId: selectedClass
      }
      setPaths(prev => [...prev, newPath])
      
      // Notify parent of selection
      onSelectionComplete({
        points: currentPath,
        classId: selectedClass
      })
    }
    setCurrentPath([])
  }, [isDrawing, currentPath, selectedTool, brushSize, selectedClass, onSelectionComplete])

  const handlePolygonClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (selectedTool !== 'polygon') return
    
    const pos = e.target.getStage()?.getPointerPosition()
    if (pos) {
      const newPoints = [...polygonPoints, pos.x / scale, pos.y / scale]
      setPolygonPoints(newPoints)
    }
  }, [selectedTool, polygonPoints, scale])

  const completePolygon = useCallback(() => {
    if (polygonPoints.length >= 6) { // At least 3 points
      const newPath = {
        points: polygonPoints,
        tool: 'polygon',
        size: 1,
        classId: selectedClass
      }
      setPaths(prev => [...prev, newPath])
      
      onSelectionComplete({
        points: polygonPoints,
        classId: selectedClass
      })
    }
    setPolygonPoints([])
  }, [polygonPoints, selectedClass, onSelectionComplete])

  const clearAll = useCallback(() => {
    setPaths([])
    setPolygonPoints([])
    setCurrentPath([])
  }, [])

  const undoLast = useCallback(() => {
    setPaths(prev => prev.slice(0, -1))
  }, [])

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Manual Selection</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={undoLast}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              disabled={paths.length === 0}
            >
              Undo
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded"
            >
              Clear All
            </button>
            {selectedTool === 'polygon' && polygonPoints.length >= 6 && (
              <button
                onClick={completePolygon}
                className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
              >
                Complete Polygon
              </button>
            )}
          </div>
        </div>

        <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ width: containerWidth, height: containerHeight }}>
          <Stage
            ref={stageRef}
            width={containerWidth}
            height={containerHeight}
            scaleX={scale}
            scaleY={scale}
            onMouseDown={selectedTool === 'polygon' ? handlePolygonClick : handleMouseDown}
            onMousemove={handleMouseMove}
            onMouseup={handleMouseUp}
          >
            <Layer>
              {/* Original image */}
              {image && (
                <KonvaImage
                  image={image}
                  width={imageWidth}
                  height={imageHeight}
                  listening={false}
                />
              )}
              
              {/* Drawn paths */}
              {paths.map((path, index) => (
                <Line
                  key={index}
                  points={path.points}
                  stroke={getClassColor(path.classId)}
                  strokeWidth={path.tool === 'eraser' ? path.size * 2 : path.size}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation={path.tool === 'eraser' ? 'destination-out' : 'source-over'}
                  closed={path.tool === 'polygon'}
                  fill={path.tool === 'polygon' ? getClassColor(path.classId) + '40' : undefined}
                />
              ))}
              
              {/* Current path being drawn */}
              {currentPath.length > 0 && (
                <Line
                  points={currentPath}
                  stroke={getClassColor(selectedClass)}
                  strokeWidth={brushSize}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                />
              )}
              
              {/* Current polygon being drawn */}
              {polygonPoints.length > 0 && (
                <Line
                  points={polygonPoints}
                  stroke={getClassColor(selectedClass)}
                  strokeWidth={2}
                  lineCap="round"
                  lineJoin="round"
                  dash={[5, 5]}
                />
              )}
            </Layer>
          </Stage>

          {/* Instructions */}
          <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
            {selectedTool === 'brush' && 'Click and drag to paint areas'}
            {selectedTool === 'eraser' && 'Click and drag to erase'}
            {selectedTool === 'polygon' && 'Click to add points, then Complete Polygon'}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to get class color
function getClassColor(classId: number): string {
  const colors: { [key: number]: string } = {
    1: '#FF6B6B', // Walls
    2: '#4ECDC4', // Roof
    3: '#45B7D1', // Windows
    4: '#96CEB4', // Doors
    5: '#FFEAA7', // Trim
    6: '#DDA0DD', // Landscape
    7: '#87CEEB'  // Sky
  }
  return colors[classId] || '#FF6B6B'
}