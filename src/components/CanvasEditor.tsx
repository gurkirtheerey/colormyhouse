import React, { useRef, useState, useCallback, useEffect } from 'react'
import { Stage, Layer, Image as KonvaImage } from 'react-konva'
import Konva from 'konva'
import { Tool, Color } from '../types'
import { colorProcessor, ColorChangeOptions } from '../services/colorProcessor'
import { SegmentationMask } from '../services/segmentation'

interface CanvasEditorProps {
  imageUrl: string
  width: number
  height: number
  activeTool?: Tool
  selectedColor?: Color
  colorIntensity?: number
  selectedMasks?: SegmentationMask[]
  onSelectionChange?: (selection: unknown) => void
  onColorChange?: (newImageData: globalThis.ImageData) => void
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  imageUrl,
  width,
  height,
  selectedColor,
  colorIntensity = 1,
  selectedMasks = [],
  onColorChange
}) => {
  const stageRef = useRef<Konva.Stage>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [originalImageData, setOriginalImageData] = useState<globalThis.ImageData | null>(null)
  const [previewImageData, setPreviewImageData] = useState<globalThis.ImageData | null>(null)
  const [finalImage, setFinalImage] = useState<HTMLImageElement | null>(null)
  const [forceRenderCounter, setForceRenderCounter] = useState(0)

  // Debug finalImage changes
  useEffect(() => {
    console.log('finalImage state changed:', {
      hasFinalImage: !!finalImage,
      finalImageSrc: finalImage ? finalImage.src.substring(0, 50) + '...' : null,
      finalImageSize: finalImage ? `${finalImage.width}x${finalImage.height}` : null
    })
  }, [finalImage])
  const [zoom, setZoom] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)

  // Load original image and extract image data
  React.useEffect(() => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = imageUrl
    img.onload = () => {
      setImage(img)
      
      console.log('Image loaded:', {
        originalSize: `${img.width}x${img.height}`,
        canvasSize: `${width}x${height}`,
        scaleX: width / img.width,
        scaleY: height / img.height
      })
      
      // Extract original image data for color processing
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, img.width, img.height)
      setOriginalImageData(imageData)
      
      console.log('Original image data:', {
        width: imageData.width,
        height: imageData.height,
        dataLength: imageData.data.length
      })
    }
  }, [imageUrl, width, height])

  // Create combined mask from selected segmentation masks
  const createCombinedMask = useCallback((masks: SegmentationMask[]): Uint8Array => {
    if (masks.length === 0 || !originalImageData) {
      console.log('No masks or image data:', { masks: masks.length, hasImageData: !!originalImageData })
      return new Uint8Array(0)
    }

    const { width: imgWidth, height: imgHeight } = originalImageData
    const combinedMask = new Uint8Array(imgWidth * imgHeight)
    
    console.log('Creating combined mask:', { 
      maskCount: masks.length, 
      imageSize: `${imgWidth}x${imgHeight}`,
      maskClasses: masks.map(m => m.classId)
    })
    
    let totalPixels = 0
    let minX = imgWidth, maxX = 0, minY = imgHeight, maxY = 0
    
    masks.forEach(mask => {
      let maskPixels = 0
      for (let i = 0; i < mask.data.length; i++) {
        if (mask.data[i] > 0) {
          combinedMask[i] = mask.classId
          maskPixels++
          totalPixels++
          
          // Calculate bounding box of the mask
          const x = i % imgWidth
          const y = Math.floor(i / imgWidth)
          minX = Math.min(minX, x)
          maxX = Math.max(maxX, x)
          minY = Math.min(minY, y)
          maxY = Math.max(maxY, y)
        }
      }
      console.log(`Mask ${mask.classId} (${mask.className}): ${maskPixels} pixels`)
    })
    
    console.log('Mask bounding box:', {
      topLeft: `(${minX}, ${minY})`,
      bottomRight: `(${maxX}, ${maxY})`,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      relativePosition: {
        left: `${((minX / imgWidth) * 100).toFixed(1)}%`,
        top: `${((minY / imgHeight) * 100).toFixed(1)}%`,
        right: `${((maxX / imgWidth) * 100).toFixed(1)}%`,
        bottom: `${((maxY / imgHeight) * 100).toFixed(1)}%`
      }
    })
    
    console.log('Total selected pixels:', totalPixels)
    return combinedMask
  }, [originalImageData])

  // Apply color change with real-time preview
  const applyColorChange = useCallback(async (usePreview: boolean = true) => {
    console.log('applyColorChange called:', { 
      usePreview, 
      hasImageData: !!originalImageData, 
      hasColor: !!selectedColor, 
      maskCount: selectedMasks.length,
      colorHex: selectedColor?.hex,
      intensity: colorIntensity
    })

    if (!originalImageData || !selectedColor || selectedMasks.length === 0) {
      console.log('Skipping color change - missing requirements')
      return
    }

    setIsProcessing(true)
    
    try {
      const combinedMask = createCombinedMask(selectedMasks)
      
      if (combinedMask.length === 0) {
        console.log('Empty combined mask, skipping processing')
        setIsProcessing(false)
        return
      }
      
      const colorOptions: ColorChangeOptions = {
        newColor: selectedColor.hex,
        preserveTexture: true,
        blendEdges: !usePreview, // Skip blending for faster preview
        intensity: colorIntensity
      }

      console.log('Color options:', {
        originalColor: selectedColor.hex,
        intensity: colorIntensity,
        preserveTexture: colorOptions.preserveTexture,
        blendEdges: colorOptions.blendEdges
      })

      console.log('Starting color processing with options:', colorOptions)

      const result = usePreview 
        ? await colorProcessor.createPreview(originalImageData, combinedMask, colorOptions, 0.5)
        : await colorProcessor.applyColorChange(originalImageData, combinedMask, colorOptions)

      console.log('Color processing completed:', { 
        processingTime: result.processingTime,
        usePreview,
        imageDataSize: result.imageData ? `${result.imageData.width}x${result.imageData.height}` : 'null'
      })

      if (usePreview) {
        setPreviewImageData(result.imageData)
      } else {
        console.log('Calling onColorChange with result')
        
        // Create final image element to display the result
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        canvas.width = result.imageData.width
        canvas.height = result.imageData.height
        ctx.putImageData(result.imageData, 0, 0)
        
        // Debug the canvas content before creating image
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        let redPixelCount = 0
        for (let i = 0; i < imageData.data.length; i += 4) {
          if (imageData.data[i] > 200 && imageData.data[i + 1] < 50 && imageData.data[i + 2] < 50) {
            redPixelCount++
          }
        }
        console.log('Canvas debug:', {
          canvasSize: `${canvas.width}x${canvas.height}`,
          totalPixels: imageData.data.length / 4,
          redPixelCount,
          hasRedPixels: redPixelCount > 0
        })
        
        const dataURL = canvas.toDataURL()
        console.log('Canvas dataURL length:', dataURL.length)
        console.log('DataURL preview:', dataURL.substring(0, 100))
        
        const finalImg = new window.Image()
        finalImg.onload = () => {
          console.log('Final image loaded:', {
            imageSize: `${finalImg.width}x${finalImg.height}`,
            naturalSize: `${finalImg.naturalWidth}x${finalImg.naturalHeight}`,
            src: finalImg.src.substring(0, 50) + '...'
          })
          setFinalImage(finalImg)
          setForceRenderCounter(prev => prev + 1) // Force React re-render
          console.log('Final image created and set')
          
          // Force Konva stage to redraw
          setTimeout(() => {
            const stage = stageRef.current
            if (stage) {
              stage.batchDraw()
              console.log('Forced Konva stage redraw')
            }
          }, 100)
        }
        finalImg.onerror = (err) => {
          console.error('Final image failed to load:', err)
        }
        finalImg.src = dataURL
        
        onColorChange?.(result.imageData)
      }
      
      console.log(`Color processing took ${result.processingTime.toFixed(2)}ms`)
    } catch (error) {
      console.error('Color processing failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [originalImageData, selectedColor, selectedMasks, colorIntensity, createCombinedMask, onColorChange])

  // Real-time preview updates when color or intensity changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (selectedColor && selectedMasks.length > 0) {
        applyColorChange(true) // Create preview
      } else {
        setPreviewImageData(null) // Clear preview if no selection
      }
    }, 100) // 100ms debounce for smooth real-time updates

    return () => clearTimeout(debounceTimer)
  }, [selectedColor, colorIntensity, selectedMasks, applyColorChange])

  // Apply final high-resolution color change
  const applyFinalColorChange = useCallback(() => {
    applyColorChange(false) // Full resolution
  }, [applyColorChange])

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

  // Create preview image element for Konva
  const [previewImage, setPreviewImage] = useState<HTMLImageElement | null>(null)
  
  useEffect(() => {
    if (previewImageData) {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      canvas.width = previewImageData.width
      canvas.height = previewImageData.height
      ctx.putImageData(previewImageData, 0, 0)
      
      const img = new window.Image()
      img.src = canvas.toDataURL()
      img.onload = () => setPreviewImage(img)
    } else {
      setPreviewImage(null)
    }
  }, [previewImageData])

  return (
    <div className="relative">
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          onWheel={handleWheel}
          className="bg-gray-100"
          key={`stage-${forceRenderCounter}`} // Force complete re-mount when finalImage changes
        >
          <Layer>
            {/* Always show either final image or original image */}
            {finalImage ? (
              <KonvaImage
                image={finalImage}
                width={width}
                height={height}
                listening={false}
                key="final-image"
                ref={(node) => {
                  if (node) {
                    console.log('🖼️ FINAL IMAGE Konva node created:', {
                      imageNaturalSize: `${finalImage.naturalWidth}x${finalImage.naturalHeight}`,
                      displaySize: `${width}x${height}`,
                      scaleX: width / finalImage.naturalWidth,
                      scaleY: height / finalImage.naturalHeight,
                      visible: node.visible(),
                      opacity: node.opacity()
                    })
                  }
                }}
              />
            ) : image ? (
              <KonvaImage
                image={image}
                width={width}
                height={height}
                listening={false}
                key="original-image"
                ref={(node) => {
                  if (node) {
                    console.log('🖼️ ORIGINAL IMAGE Konva node created:', {
                      imageNaturalSize: `${image.naturalWidth}x${image.naturalHeight}`,
                      displaySize: `${width}x${height}`,
                      scaleX: width / image.naturalWidth,
                      scaleY: height / image.naturalHeight
                    })
                  }
                }}
              />
            ) : null}
            
            {/* Preview overlay (only show when no final image) */}
            {previewImage && !finalImage && (
              <KonvaImage
                image={previewImage}
                width={width}
                height={height}
                opacity={0.8}
                listening={false}
                key="preview"
                onMount={() => {
                  console.log('Preview image mounted')
                }}
              />
            )}
            
            {/* Debug overlay to show mask location - only when processing for debugging */}
            {isProcessing && selectedMasks.length > 0 && originalImageData && (
              <rect
                x={0}
                y={0}
                width={width * 0.3} // Show in top-left corner where the mask apparently is
                height={height * 0.3}
                fill="rgba(255, 0, 0, 0.3)"
                stroke="red"
                strokeWidth={2}
                listening={false}
              />
            )}
          </Layer>
        </Stage>
      </div>
      
      {/* Controls */}
      <div className="absolute top-4 left-4 space-y-2">
        {selectedMasks.length > 0 && selectedColor && !finalImage && (
          <div className="bg-white rounded-lg shadow p-3 space-y-2">
            <div className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: selectedColor.hex }}
              />
              <span className="text-sm font-medium text-gray-700">
                {selectedMasks.length} area{selectedMasks.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            
            <button
              onClick={applyFinalColorChange}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
            >
              {isProcessing ? 'Processing...' : 'Apply Color Change'}
            </button>
            
            <button
              onClick={() => {
                console.log('Test mode: Applying bright red for visibility')
                const testColorOptions: ColorChangeOptions = {
                  newColor: '#FF0000', // Bright red for testing
                  preserveTexture: false, // Disable texture preservation for maximum visibility
                  blendEdges: false,
                  intensity: 1
                }
                
                if (!originalImageData) return
                setIsProcessing(true)
                
                const combinedMask = createCombinedMask(selectedMasks)
                colorProcessor.applyColorChange(originalImageData, combinedMask, testColorOptions)
                  .then(result => {
                    console.log('Test color applied - should be bright red!')
                    const canvas = document.createElement('canvas')
                    const ctx = canvas.getContext('2d')!
                    canvas.width = result.imageData.width
                    canvas.height = result.imageData.height
                    ctx.putImageData(result.imageData, 0, 0)
                    
                    // Debug the RED TEST canvas content
                    const testImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                    let redPixelCount = 0
                    let totalNonZero = 0
                    for (let i = 0; i < testImageData.data.length; i += 4) {
                      if (testImageData.data[i + 3] > 0) totalNonZero++ // Non-transparent pixels
                      if (testImageData.data[i] > 200 && testImageData.data[i + 1] < 50 && testImageData.data[i + 2] < 50) {
                        redPixelCount++
                      }
                    }
                    console.log('🔴 RED TEST Canvas debug:', {
                      canvasSize: `${canvas.width}x${canvas.height}`,
                      totalPixels: testImageData.data.length / 4,
                      nonTransparentPixels: totalNonZero,
                      redPixelCount,
                      hasRedPixels: redPixelCount > 0,
                      redPercentage: ((redPixelCount / totalNonZero) * 100).toFixed(2) + '%'
                    })
                    
                    const dataURL = canvas.toDataURL()
                    console.log('🔴 RED TEST DataURL length:', dataURL.length)
                    
                    const finalImg = new window.Image()
                    finalImg.onload = () => {
                      console.log('🔴 RED TEST Final image loaded:', {
                        imageSize: `${finalImg.width}x${finalImg.height}`,
                        naturalSize: `${finalImg.naturalWidth}x${finalImg.naturalHeight}`,
                        displayCanvasSize: `${width}x${height}`
                      })
                      setFinalImage(finalImg)
                      setForceRenderCounter(prev => prev + 1) // Force React re-render
                      console.log('🔴 Test red image set - you should see bright red!')
                      
                      // Force Konva stage to redraw
                      setTimeout(() => {
                        const stage = stageRef.current
                        if (stage) {
                          stage.batchDraw()
                          console.log('🔴 Forced Konva stage redraw for test image')
                        }
                      }, 100)
                    }
                    finalImg.onerror = (err) => {
                      console.error('🔴 RED TEST image failed to load:', err)
                    }
                    finalImg.src = dataURL
                    onColorChange?.(result.imageData)
                  })
                  .finally(() => setIsProcessing(false))
              }}
              disabled={isProcessing}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm font-medium py-1 px-3 rounded transition-colors"
            >
              🔴 Test with Bright Red
            </button>
            
            <button
              onClick={() => {
                console.log('🟥 SIMPLE RED TEST: Creating a simple red rectangle')
                if (!originalImageData) return
                
                // Create a simple red image to test display
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')!
                canvas.width = originalImageData.width
                canvas.height = originalImageData.height
                
                // Fill with original image first
                ctx.putImageData(originalImageData, 0, 0)
                
                // Draw a big red rectangle over it
                ctx.fillStyle = '#FF0000'
                ctx.fillRect(canvas.width * 0.2, canvas.height * 0.2, canvas.width * 0.6, canvas.height * 0.6)
                
                console.log('🟥 Simple red rectangle drawn on canvas')
                
                const dataURL = canvas.toDataURL()
                const finalImg = new window.Image()
                finalImg.onload = () => {
                  console.log('🟥 Simple red test image loaded')
                  setFinalImage(finalImg)
                  setForceRenderCounter(prev => prev + 1)
                }
                finalImg.src = dataURL
              }}
              disabled={isProcessing}
              className="w-full bg-red-800 hover:bg-red-900 disabled:bg-gray-400 text-white text-sm font-medium py-1 px-3 rounded transition-colors"
            >
              🟥 Simple Red Rectangle Test
            </button>
          </div>
        )}
        
        {finalImage && (
          <div className="bg-white rounded-lg shadow p-3 space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-sm font-medium text-gray-700">
                Color applied successfully!
              </span>
            </div>
            
            <button
              onClick={() => {
                setFinalImage(null)
                setPreviewImageData(null)
                setForceRenderCounter(prev => prev + 1) // Force re-render when resetting
                console.log('Reset to original image')
              }}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
            >
              Reset to Original
            </button>
          </div>
        )}
        
        {isProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-700">Processing color change...</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 bg-white px-3 py-1 rounded shadow">
        <span className="text-sm text-gray-600">
          Zoom: {Math.round(zoom * 100)}%
        </span>
      </div>
      
      {/* Performance indicator */}
      {previewImageData && (
        <div className="absolute bottom-4 left-4 bg-green-50 border border-green-200 rounded px-2 py-1">
          <span className="text-xs text-green-700">Real-time preview active</span>
        </div>
      )}
    </div>
  )
}