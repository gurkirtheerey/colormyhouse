// Color processing service for realistic house color changes
// Preserves texture, shadows, and lighting while changing hue

export interface ColorChangeOptions {
  newColor: string // Hex color (e.g., "#FF6B6B")
  preserveTexture: boolean
  blendEdges: boolean
  intensity: number // 0-1, how strong the color change should be
}

export interface ProcessingResult {
  imageData: globalThis.ImageData
  processingTime: number
}

export interface ColorHSL {
  h: number // 0-360
  s: number // 0-100
  l: number // 0-100
}

export interface ColorRGB {
  r: number // 0-255
  g: number // 0-255
  b: number // 0-255
}

class ColorProcessor {
  // Convert RGB to HSL color space for better color manipulation
  rgbToHsl(r: number, g: number, b: number): ColorHSL {
    r /= 255
    g /= 255
    b /= 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h: number, s: number, l: number

    l = (max + min) / 2

    if (max === min) {
      h = s = 0 // achromatic
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
        default: h = 0
      }
      h /= 6
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    }
  }

  // Convert HSL back to RGB
  hslToRgb(h: number, s: number, l: number): ColorRGB {
    h /= 360
    s /= 100
    l /= 100

    let r: number, g: number, b: number

    if (s === 0) {
      r = g = b = l // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1/6) return p + (q - p) * 6 * t
        if (t < 1/2) return q
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
        return p
      }

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q

      r = hue2rgb(p, q, h + 1/3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1/3)
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    }
  }

  // Convert hex color to RGB
  hexToRgb(hex: string): ColorRGB {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 }
  }

  // Apply color change to image data with mask
  async applyColorChange(
    originalImageData: globalThis.ImageData,
    mask: Uint8Array,
    options: ColorChangeOptions
  ): Promise<ProcessingResult> {
    const startTime = performance.now()
    
    const { width, height } = originalImageData
    const newImageData = new ImageData(
      new Uint8ClampedArray(originalImageData.data),
      width,
      height
    )

    // Convert new color to HSL
    const newRgb = this.hexToRgb(options.newColor)
    const newHsl = this.rgbToHsl(newRgb.r, newRgb.g, newRgb.b)

    // Process each pixel
    for (let i = 0; i < mask.length; i++) {
      if (mask[i] > 0) { // Pixel is selected
        const pixelIndex = i * 4
        const originalR = originalImageData.data[pixelIndex]
        const originalG = originalImageData.data[pixelIndex + 1]
        const originalB = originalImageData.data[pixelIndex + 2]

        // Convert original pixel to HSL
        const originalHsl = this.rgbToHsl(originalR, originalG, originalB)

        // Create new color by replacing hue but preserving saturation and lightness
        let newH = newHsl.h
        let newS = originalHsl.s
        let newL = originalHsl.l

        // Adjust saturation slightly to match new color's characteristics
        if (options.preserveTexture) {
          // For very dark or light areas, reduce saturation to preserve shadows/highlights
          if (originalHsl.l < 15) {
            newS = Math.min(newS, 20) // Very dark shadows - minimal saturation
          } else if (originalHsl.l > 85) {
            newS = Math.min(newS, 30) // Very bright highlights - minimal saturation
          } else {
            // Mid-tones: use more of the new color's saturation for visibility
            newS = originalHsl.s * 0.4 + newHsl.s * 0.6
            // Ensure minimum saturation for visible color change
            newS = Math.max(newS, 25)
          }
        } else {
          // If not preserving texture, use the target color's HSL values directly for maximum visibility
          newH = newHsl.h
          newS = newHsl.s
          newL = newHsl.l
        }

        // Apply intensity factor
        if (options.intensity < 1) {
          // Blend between original and new hue
          const hDiff = newH - originalHsl.h
          newH = originalHsl.h + (hDiff * options.intensity)
          newS = originalHsl.s + ((newS - originalHsl.s) * options.intensity)
        }

        // Convert back to RGB
        const newRgbPixel = this.hslToRgb(newH, newS, newL)

        // Apply edge blending for smooth transitions
        let blendFactor = 1
        if (options.blendEdges) {
          blendFactor = this.calculateEdgeBlending(mask, i, width, height)
        }

        // Set new pixel values with blending
        newImageData.data[pixelIndex] = Math.round(
          originalR + (newRgbPixel.r - originalR) * blendFactor
        )
        newImageData.data[pixelIndex + 1] = Math.round(
          originalG + (newRgbPixel.g - originalG) * blendFactor
        )
        newImageData.data[pixelIndex + 2] = Math.round(
          originalB + (newRgbPixel.b - originalB) * blendFactor
        )
      }
    }

    const processingTime = performance.now() - startTime
    return {
      imageData: newImageData,
      processingTime
    }
  }

  // Calculate edge blending factor for smooth transitions
  private calculateEdgeBlending(
    mask: Uint8Array, 
    pixelIndex: number, 
    width: number, 
    height: number
  ): number {
    const x = pixelIndex % width
    const y = Math.floor(pixelIndex / width)
    
    // Check neighboring pixels to see if we're at an edge
    let selectedNeighbors = 0
    let totalNeighbors = 0
    
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = x + dx
        const ny = y + dy
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const neighborIndex = ny * width + nx
          totalNeighbors++
          if (mask[neighborIndex] > 0) {
            selectedNeighbors++
          }
        }
      }
    }
    
    // Return blend factor (1.0 for fully inside, 0.5-0.8 for edges)
    const edgeRatio = selectedNeighbors / totalNeighbors
    return Math.max(0.5, edgeRatio)
  }

  // Create optimized preview (lower resolution for real-time updates)
  async createPreview(
    originalImageData: globalThis.ImageData,
    mask: Uint8Array,
    options: ColorChangeOptions,
    previewScale: number = 0.25
  ): Promise<ProcessingResult> {
    const scaledWidth = Math.floor(originalImageData.width * previewScale)
    const scaledHeight = Math.floor(originalImageData.height * previewScale)
    
    // Downsample image and mask for faster processing
    const scaledImageData = this.downsampleImageData(originalImageData, scaledWidth, scaledHeight)
    const scaledMask = this.downsampleMask(mask, originalImageData.width, originalImageData.height, scaledWidth, scaledHeight)
    
    return this.applyColorChange(scaledImageData, scaledMask, {
      ...options,
      blendEdges: false // Skip edge blending for preview performance
    })
  }

  // Downsample image data for preview
  private downsampleImageData(
    imageData: globalThis.ImageData, 
    newWidth: number, 
    newHeight: number
  ): globalThis.ImageData {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    canvas.width = imageData.width
    canvas.height = imageData.height
    ctx.putImageData(imageData, 0, 0)
    
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')!
    tempCanvas.width = newWidth
    tempCanvas.height = newHeight
    
    tempCtx.drawImage(canvas, 0, 0, newWidth, newHeight)
    return tempCtx.getImageData(0, 0, newWidth, newHeight)
  }

  // Downsample mask for preview
  private downsampleMask(
    mask: Uint8Array,
    originalWidth: number,
    originalHeight: number,
    newWidth: number,
    newHeight: number
  ): Uint8Array {
    const scaledMask = new Uint8Array(newWidth * newHeight)
    const scaleX = originalWidth / newWidth
    const scaleY = originalHeight / newHeight
    
    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const sourceX = Math.floor(x * scaleX)
        const sourceY = Math.floor(y * scaleY)
        const sourceIndex = sourceY * originalWidth + sourceX
        
        scaledMask[y * newWidth + x] = mask[sourceIndex]
      }
    }
    
    return scaledMask
  }

  // Convert polygon selection to mask
  polygonToMask(
    points: number[], 
    width: number, 
    height: number, 
    classId: number
  ): Uint8Array {
    const mask = new Uint8Array(width * height)
    
    // Use scanline algorithm for polygon fill
    for (let y = 0; y < height; y++) {
      const intersections: number[] = []
      
      // Find intersections with polygon edges
      for (let i = 0; i < points.length; i += 2) {
        const x1 = points[i]
        const y1 = points[i + 1]
        const x2 = points[(i + 2) % points.length]
        const y2 = points[(i + 3) % points.length]
        
        if ((y1 <= y && y < y2) || (y2 <= y && y < y1)) {
          const x = x1 + (y - y1) * (x2 - x1) / (y2 - y1)
          intersections.push(x)
        }
      }
      
      intersections.sort((a, b) => a - b)
      
      // Fill between pairs of intersections
      for (let i = 0; i < intersections.length; i += 2) {
        if (i + 1 < intersections.length) {
          const startX = Math.max(0, Math.floor(intersections[i]))
          const endX = Math.min(width - 1, Math.ceil(intersections[i + 1]))
          
          for (let x = startX; x <= endX; x++) {
            mask[y * width + x] = classId
          }
        }
      }
    }
    
    return mask
  }

  // Get color recommendations based on house style and existing colors
  getColorRecommendations(originalColor: string): string[] {
    const originalRgb = this.hexToRgb(originalColor)
    const originalHsl = this.rgbToHsl(originalRgb.r, originalRgb.g, originalRgb.b)
    
    const recommendations: string[] = []
    
    // Generate complementary colors
    const complementaryH = (originalHsl.h + 180) % 360
    recommendations.push(this.hslToHex(complementaryH, originalHsl.s, originalHsl.l))
    
    // Generate analogous colors
    recommendations.push(this.hslToHex((originalHsl.h + 30) % 360, originalHsl.s, originalHsl.l))
    recommendations.push(this.hslToHex((originalHsl.h - 30 + 360) % 360, originalHsl.s, originalHsl.l))
    
    // Popular house colors
    const popularColors = [
      '#F5F5DC', // Beige
      '#D2B48C', // Tan
      '#8B7355', // Dark Khaki
      '#696969', // Dim Gray
      '#2F4F4F', // Dark Slate Gray
      '#8B4513', // Saddle Brown
      '#CD853F', // Peru
      '#A0522D'  // Sienna
    ]
    
    recommendations.push(...popularColors.slice(0, 3))
    
    return recommendations
  }

  private hslToHex(h: number, s: number, l: number): string {
    const rgb = this.hslToRgb(h, s, l)
    return `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`
  }
}

export const colorProcessor = new ColorProcessor()