import React, { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Image as KonvaImage } from 'react-konva'
import Konva from 'konva'
import { SegmentationResult, SEGMENTATION_CLASSES } from '../services/segmentation'

interface SegmentationViewerProps {
  imageUrl: string
  imageWidth: number
  imageHeight: number
  segmentationResult: SegmentationResult | null
  onAreaSelect?: (classId: number) => void
  selectedAreas?: number[]
}

export const SegmentationViewer: React.FC<SegmentationViewerProps> = ({
  imageUrl,
  imageWidth,
  imageHeight,
  segmentationResult,
  onAreaSelect,
  selectedAreas = []
}) => {
  const stageRef = useRef<Konva.Stage>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [segmentationMasks, setSegmentationMasks] = useState<{ [key: number]: HTMLCanvasElement }>({})
  const [hoveredClass, setHoveredClass] = useState<number | null>(null)
  
  const containerWidth = 600
  const containerHeight = 400
  const scale = Math.min(containerWidth / imageWidth, containerHeight / imageHeight)

  // Load the original image
  useEffect(() => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = imageUrl
    img.onload = () => {
      setImage(img)
    }
  }, [imageUrl])

  // Create mask canvases from segmentation result
  useEffect(() => {
    if (!segmentationResult) {
      setSegmentationMasks({})
      return
    }

    const masks: { [key: number]: HTMLCanvasElement } = {}
    
    segmentationResult.masks.forEach(mask => {
      
      const canvas = document.createElement('canvas')
      canvas.width = mask.width
      canvas.height = mask.height
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        const imageData = ctx.createImageData(mask.width, mask.height)
        const segClass = SEGMENTATION_CLASSES.find(c => c.id === mask.classId)
        const color = segClass ? hexToRgb(segClass.color) : { r: 255, g: 0, b: 0 }
        
        // Apply edge refinement and anti-aliasing
        for (let y = 0; y < mask.height; y++) {
          for (let x = 0; x < mask.width; x++) {
            const i = y * mask.width + x
            const pixelIndex = i * 4
            
            if (mask.data[i] === mask.classId) {
              // Check if this is an edge pixel for anti-aliasing
              const edgeStrength = calculateEdgeStrength(mask.data, x, y, mask.width, mask.height, mask.classId)
              const alpha = Math.floor(120 * edgeStrength) // Vary transparency based on edge strength
              
              imageData.data[pixelIndex] = color.r     // R
              imageData.data[pixelIndex + 1] = color.g // G
              imageData.data[pixelIndex + 2] = color.b // B
              imageData.data[pixelIndex + 3] = Math.max(60, alpha) // A with minimum visibility
            } else {
              imageData.data[pixelIndex + 3] = 0       // Transparent
            }
          }
        }
        
        ctx.putImageData(imageData, 0, 0)
        masks[mask.classId] = canvas
      }
    })
    
    setSegmentationMasks(masks)
  }, [segmentationResult])

  // Pixel-perfect click detection
  const handleStageClick = () => {
    const stage = stageRef.current
    if (!stage || !segmentationResult) return

    const pos = stage.getPointerPosition()
    if (!pos) return

    // Convert stage coordinates to image coordinates
    const imageX = Math.floor(pos.x / scale)
    const imageY = Math.floor(pos.y / scale)

    // Check if click is within image bounds
    if (imageX < 0 || imageX >= imageWidth || imageY < 0 || imageY >= imageHeight) {
      return
    }

    // Find which segmentation class was clicked (pixel-perfect)
    const clickedClassId = getClassAtPixel(imageX, imageY)
    
    if (clickedClassId && clickedClassId !== 0 && onAreaSelect) {
      onAreaSelect(clickedClassId)
    }
  }

  // Get the segmentation class at a specific pixel coordinate
  const getClassAtPixel = (x: number, y: number): number | null => {
    if (!segmentationResult) return null

    const pixelIndex = y * imageWidth + x

    // Check each mask to find which class owns this pixel
    for (const mask of segmentationResult.masks) {
      if (mask.data[pixelIndex] === mask.classId) {
        return mask.classId
      }
    }

    return 0 // Background
  }

  // Enhanced hover detection for real-time feedback
  const handleStageMouseMove = () => {
    const stage = stageRef.current
    if (!stage || !segmentationResult) return

    const pos = stage.getPointerPosition()
    if (!pos) return

    const imageX = Math.floor(pos.x / scale)
    const imageY = Math.floor(pos.y / scale)

    if (imageX >= 0 && imageX < imageWidth && imageY >= 0 && imageY < imageHeight) {
      const hoveredClassId = getClassAtPixel(imageX, imageY)
      setHoveredClass(hoveredClassId && hoveredClassId !== 0 ? hoveredClassId : null)
    } else {
      setHoveredClass(null)
    }
  }

  const handleStageMouseLeave = () => {
    setHoveredClass(null)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Detected Areas</h3>
          <div className="text-sm text-gray-500">
            Click on areas to select for recoloring
          </div>
        </div>
        
        <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ width: containerWidth, height: containerHeight }}>
          <Stage
            ref={stageRef}
            width={containerWidth}
            height={containerHeight}
            scaleX={scale}
            scaleY={scale}
            onClick={handleStageClick}
            onMouseMove={handleStageMouseMove}
            onMouseLeave={handleStageMouseLeave}
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
              
              {/* Segmentation masks - now non-interactive for pixel-perfect detection */}
              {Object.entries(segmentationMasks).map(([classId, maskCanvas]) => {
                const id = parseInt(classId)
                const isSelected = selectedAreas.includes(id)
                const isHovered = hoveredClass === id
                const opacity = isSelected ? 0.7 : isHovered ? 0.5 : 0.3
                
                return (
                  <KonvaImage
                    key={classId}
                    image={maskCanvas}
                    width={imageWidth}
                    height={imageHeight}
                    opacity={opacity}
                    listening={false}
                  />
                )
              })}
            </Layer>
          </Stage>
          
          {/* Hover tooltip */}
          {hoveredClass !== null && (
            <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
              {SEGMENTATION_CLASSES.find(c => c.id === hoveredClass)?.displayName}
            </div>
          )}
        </div>
      </div>
      
      {/* Class legend */}
      {segmentationResult && (
        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="text-md font-medium text-gray-900 mb-3">Available Areas</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {segmentationResult.classes
              .filter(segClass => segClass.id !== 0) // Exclude background
              .map(segClass => {
                const isSelected = selectedAreas.includes(segClass.id)
                const mask = segmentationResult.masks.find(m => m.classId === segClass.id)
                const confidence = mask ? Math.round(mask.confidence * 100) : 0
                
                return (
                  <button
                    key={segClass.id}
                    onClick={() => onAreaSelect && onAreaSelect(segClass.id)}
                    className={`flex items-center space-x-2 p-2 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: segClass.color }}
                    />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{segClass.displayName}</span>
                      <span className="text-xs text-gray-500">{confidence}%</span>
                    </div>
                  </button>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to calculate edge strength for anti-aliasing
function calculateEdgeStrength(
  maskData: Uint8Array, 
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  classId: number
): number {
  const neighborOffsets = [
    [-1, -1], [0, -1], [1, -1],
    [-1,  0],          [1,  0],
    [-1,  1], [0,  1], [1,  1]
  ]
  
  let sameClassNeighbors = 0
  let totalNeighbors = 0
  
  for (const [dx, dy] of neighborOffsets) {
    const nx = x + dx
    const ny = y + dy
    
    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
      totalNeighbors++
      const neighborIndex = ny * width + nx
      if (maskData[neighborIndex] === classId) {
        sameClassNeighbors++
      }
    }
  }
  
  // Return edge strength (1.0 = solid interior, 0.1 = edge)
  return totalNeighbors > 0 ? Math.max(0.4, sameClassNeighbors / totalNeighbors) : 1.0
}

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 }
}