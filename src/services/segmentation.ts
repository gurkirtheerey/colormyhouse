// import * as tf from '@tensorflow/tfjs' // TODO: Will be used for actual TensorFlow model loading

export interface SegmentationMask {
  data: Uint8Array
  width: number
  height: number
  classId: number
  className: string
  confidence: number
}

export interface SegmentationResult {
  masks: SegmentationMask[]
  classes: SegmentationClass[]
}

export interface SegmentationClass {
  id: number
  name: string
  color: string
  displayName: string
}

// House segmentation classes based on CLAUDE.md spec
export const SEGMENTATION_CLASSES: SegmentationClass[] = [
  { id: 0, name: 'background', color: '#000000', displayName: 'Background' },
  { id: 1, name: 'walls', color: '#FF6B6B', displayName: 'Walls' },
  { id: 2, name: 'roof', color: '#4ECDC4', displayName: 'Roof' },
  { id: 3, name: 'windows', color: '#45B7D1', displayName: 'Windows' },
  { id: 4, name: 'doors', color: '#96CEB4', displayName: 'Doors' },
  { id: 5, name: 'trim', color: '#FFEAA7', displayName: 'Trim & Details' },
  { id: 6, name: 'landscape', color: '#DDA0DD', displayName: 'Landscape' },
  { id: 7, name: 'sky', color: '#87CEEB', displayName: 'Sky' }
]

class SegmentationService {
  private isModelLoaded = false

  async initialize(): Promise<void> {
    try {
      // For now, we'll simulate model loading
      // In production, this would load the actual U-Net model
      await new Promise(resolve => setTimeout(resolve, 1000))
      this.isModelLoaded = true
      console.log('Segmentation model initialized (mock)')
    } catch (error) {
      console.error('Failed to initialize segmentation model:', error)
      throw error
    }
  }

  async segmentImage(imageElement: HTMLImageElement): Promise<SegmentationResult> {
    if (!this.isModelLoaded) {
      await this.initialize()
    }

    try {
      // Analyze the actual image content
      const analysisResult = await this.analyzeImageContent(imageElement)
      
      return analysisResult
    } catch (error) {
      console.error('Segmentation failed:', error)
      throw error
    }
  }

  private async analyzeImageContent(imageElement: HTMLImageElement): Promise<SegmentationResult> {
    // Create canvas to analyze pixel data
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    canvas.width = imageElement.width
    canvas.height = imageElement.height
    
    // Draw image to get pixel data
    ctx.drawImage(imageElement, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    
    // Analyze image using multiple techniques
    const colorRegions = this.analyzeColorRegions(pixels, canvas.width, canvas.height)
    const edgeMap = this.detectEdges(pixels, canvas.width, canvas.height)
    const brightnessMask = this.analyzeBrightness(pixels, canvas.width, canvas.height)
    
    // Create intelligent segmentation based on actual image content
    const masks = await this.createIntelligentSegmentation(
      pixels, 
      colorRegions, 
      edgeMap, 
      brightnessMask,
      canvas.width, 
      canvas.height
    )

    return {
      masks,
      classes: SEGMENTATION_CLASSES
    }
  }

  private analyzeColorRegions(pixels: Uint8ClampedArray, width: number, height: number): number[] {
    const regions = new Array(width * height).fill(0)
    const visited = new Array(width * height).fill(false)
    let regionId = 1
    
    // Color similarity threshold
    const colorThreshold = 30
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x
        
        if (!visited[index]) {
          // Start flood fill for similar colors
          const pixelIndex = index * 4
          const r = pixels[pixelIndex]
          const g = pixels[pixelIndex + 1]
          const b = pixels[pixelIndex + 2]
          
          this.floodFillColorRegion(pixels, regions, visited, x, y, width, height, r, g, b, regionId, colorThreshold)
          regionId++
        }
      }
    }
    
    return regions
  }

  private floodFillColorRegion(
    pixels: Uint8ClampedArray, 
    regions: number[], 
    visited: boolean[], 
    startX: number, 
    startY: number, 
    width: number, 
    height: number, 
    targetR: number, 
    targetG: number, 
    targetB: number, 
    regionId: number, 
    threshold: number
  ): void {
    const stack = [{x: startX, y: startY}]
    
    while (stack.length > 0) {
      const {x, y} = stack.pop()!
      
      if (x < 0 || x >= width || y < 0 || y >= height) continue
      
      const index = y * width + x
      if (visited[index]) continue
      
      const pixelIndex = index * 4
      const r = pixels[pixelIndex]
      const g = pixels[pixelIndex + 1]
      const b = pixels[pixelIndex + 2]
      
      // Check color similarity
      const colorDiff = Math.sqrt(
        (r - targetR) ** 2 + 
        (g - targetG) ** 2 + 
        (b - targetB) ** 2
      )
      
      if (colorDiff <= threshold) {
        visited[index] = true
        regions[index] = regionId
        
        // Add neighbors to stack
        stack.push({x: x + 1, y})
        stack.push({x: x - 1, y})
        stack.push({x, y: y + 1})
        stack.push({x, y: y - 1})
      }
    }
  }

  private detectEdges(pixels: Uint8ClampedArray, width: number, height: number): number[] {
    const edges = new Array(width * height).fill(0)
    
    // Sobel edge detection
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const gx = this.getGradientX(pixels, x, y, width)
        const gy = this.getGradientY(pixels, x, y, width)
        const magnitude = Math.sqrt(gx * gx + gy * gy)
        
        edges[y * width + x] = magnitude > 50 ? 1 : 0
      }
    }
    
    return edges
  }

  private getGradientX(pixels: Uint8ClampedArray, x: number, y: number, width: number): number {
    const getGray = (px: number, py: number) => {
      const index = (py * width + px) * 4
      return (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3
    }
    
    return (
      -1 * getGray(x - 1, y - 1) + 1 * getGray(x + 1, y - 1) +
      -2 * getGray(x - 1, y) + 2 * getGray(x + 1, y) +
      -1 * getGray(x - 1, y + 1) + 1 * getGray(x + 1, y + 1)
    )
  }

  private getGradientY(pixels: Uint8ClampedArray, x: number, y: number, width: number): number {
    const getGray = (px: number, py: number) => {
      const index = (py * width + px) * 4
      return (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3
    }
    
    return (
      -1 * getGray(x - 1, y - 1) + -2 * getGray(x, y - 1) + -1 * getGray(x + 1, y - 1) +
      1 * getGray(x - 1, y + 1) + 2 * getGray(x, y + 1) + 1 * getGray(x + 1, y + 1)
    )
  }

  private analyzeBrightness(pixels: Uint8ClampedArray, width: number, height: number): number[] {
    const brightness = new Array(width * height).fill(0)
    
    for (let i = 0; i < width * height; i++) {
      const pixelIndex = i * 4
      const r = pixels[pixelIndex]
      const g = pixels[pixelIndex + 1]
      const b = pixels[pixelIndex + 2]
      
      // Calculate perceived brightness
      brightness[i] = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    }
    
    return brightness
  }

  private async createIntelligentSegmentation(
    pixels: Uint8ClampedArray,
    colorRegions: number[],
    edgeMap: number[],
    brightnessMask: number[],
    width: number,
    height: number
  ): Promise<SegmentationMask[]> {
    const masks: SegmentationMask[] = []
    
    // Analyze the image to determine likely house features
    const skyMask = this.detectSky(pixels, brightnessMask, width, height)
    const wallMask = this.detectWalls(pixels, colorRegions, edgeMap, width, height)
    const roofMask = this.detectRoof(pixels, colorRegions, brightnessMask, width, height)
    const windowMask = this.detectWindows(pixels, edgeMap, brightnessMask, width, height)
    const doorMask = this.detectDoors(pixels, edgeMap, brightnessMask, width, height)
    const landscapeMask = this.detectLandscape(pixels, colorRegions, brightnessMask, width, height)
    
    // Create masks for detected regions
    const detectedRegions = [
      { mask: skyMask, classId: 7, name: 'sky', confidence: this.calculateConfidence(skyMask) },
      { mask: roofMask, classId: 2, name: 'roof', confidence: this.calculateConfidence(roofMask) },
      { mask: wallMask, classId: 1, name: 'walls', confidence: this.calculateConfidence(wallMask) },
      { mask: windowMask, classId: 3, name: 'windows', confidence: this.calculateConfidence(windowMask) },
      { mask: doorMask, classId: 4, name: 'doors', confidence: this.calculateConfidence(doorMask) },
      { mask: landscapeMask, classId: 6, name: 'landscape', confidence: this.calculateConfidence(landscapeMask) }
    ]
    
    // Only include regions with reasonable confidence
    for (const region of detectedRegions) {
      if (region.confidence > 0.1) { // At least 10% confidence
        const segClass = SEGMENTATION_CLASSES.find(c => c.id === region.classId)!
        
        masks.push({
          data: region.mask,
          width,
          height,
          classId: region.classId,
          className: segClass.name,
          confidence: region.confidence
        })
      }
    }
    
    return masks
  }

  private detectSky(pixels: Uint8ClampedArray, brightness: number[], width: number, height: number): Uint8Array {
    const mask = new Uint8Array(width * height)
    
    // Sky is typically in upper portion, bright, and blue-ish
    for (let y = 0; y < Math.floor(height * 0.6); y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x
        const pixelIndex = index * 4
        
        const r = pixels[pixelIndex]
        const g = pixels[pixelIndex + 1]
        const b = pixels[pixelIndex + 2]
        
        // Check for blue-ish sky colors and brightness
        const isBluish = b > r && b > g
        const isBright = brightness[index] > 0.4
        const isUpperPortion = y < height * 0.4
        
        if ((isBluish && isBright) || (isUpperPortion && brightness[index] > 0.7)) {
          mask[index] = 7 // Sky class
        }
      }
    }
    
    return mask
  }

  private detectWalls(_pixels: Uint8ClampedArray, colorRegions: number[], edges: number[], width: number, height: number): Uint8Array {
    const mask = new Uint8Array(width * height)
    
    // Find large, uniform color regions in the middle portion that aren't edges
    const regionSizes = new Map<number, number>()
    
    // Count region sizes
    for (let i = 0; i < colorRegions.length; i++) {
      const regionId = colorRegions[i]
      regionSizes.set(regionId, (regionSizes.get(regionId) || 0) + 1)
    }
    
    // Find large regions likely to be walls
    const largeRegions = new Set<number>()
    for (const [regionId, size] of regionSizes) {
      if (size > width * height * 0.05) { // At least 5% of image
        largeRegions.add(regionId)
      }
    }
    
    for (let y = Math.floor(height * 0.2); y < Math.floor(height * 0.8); y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x
        const regionId = colorRegions[index]
        
        if (largeRegions.has(regionId) && edges[index] === 0) {
          mask[index] = 1 // Walls class
        }
      }
    }
    
    return mask
  }

  private detectRoof(pixels: Uint8ClampedArray, _colorRegions: number[], brightness: number[], width: number, height: number): Uint8Array {
    const mask = new Uint8Array(width * height)
    
    // Roof is typically in upper portion, darker than sky, with consistent color
    for (let y = 0; y < Math.floor(height * 0.5); y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x
        const pixelIndex = index * 4
        
        const r = pixels[pixelIndex]
        const g = pixels[pixelIndex + 1]
        const b = pixels[pixelIndex + 2]
        
        // Check for typical roof colors (dark, often reddish or grayish)
        const isDark = brightness[index] < 0.6
        const isUpperPortion = y < height * 0.4
        const isRoofColor = (r > b && g > b) || (Math.abs(r - g) < 20 && Math.abs(g - b) < 20)
        
        if (isDark && isUpperPortion && isRoofColor) {
          mask[index] = 2 // Roof class
        }
      }
    }
    
    return mask
  }

  private detectWindows(pixels: Uint8ClampedArray, edges: number[], brightness: number[], width: number, height: number): Uint8Array {
    const mask = new Uint8Array(width * height)
    
    // Windows are typically rectangular, reflective (bright), with strong edges
    for (let y = Math.floor(height * 0.2); y < Math.floor(height * 0.8); y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x
        
        const isBright = brightness[index] > 0.6
        const hasEdges = this.hasStrongEdgesNearby(edges, x, y, width, height, 5)
        const isReflective = this.isReflectiveArea(pixels, x, y, width, height)
        
        if (isBright && hasEdges && isReflective) {
          mask[index] = 3 // Windows class
        }
      }
    }
    
    return mask
  }

  private detectDoors(pixels: Uint8ClampedArray, edges: number[], _brightness: number[], width: number, height: number): Uint8Array {
    const mask = new Uint8Array(width * height)
    
    // Doors are typically vertical rectangles with strong edges, in lower-middle portion
    for (let y = Math.floor(height * 0.4); y < Math.floor(height * 0.9); y++) {
      for (let x = Math.floor(width * 0.2); x < Math.floor(width * 0.8); x++) {
        const index = y * width + x
        
        const hasVerticalEdges = this.hasVerticalEdgesNearby(edges, x, y, width, height)
        const isDoorArea = y > height * 0.5 // Lower portion
        const hasDoorColor = this.hasDoorColor(pixels, x, y, width)
        
        if (hasVerticalEdges && isDoorArea && hasDoorColor) {
          mask[index] = 4 // Doors class
        }
      }
    }
    
    return mask
  }

  private detectLandscape(pixels: Uint8ClampedArray, _colorRegions: number[], _brightness: number[], width: number, height: number): Uint8Array {
    const mask = new Uint8Array(width * height)
    
    // Landscape is typically in lower portion, green-ish, with natural textures
    for (let y = Math.floor(height * 0.7); y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x
        const pixelIndex = index * 4
        
        const r = pixels[pixelIndex]
        const g = pixels[pixelIndex + 1]
        const b = pixels[pixelIndex + 2]
        
        // Check for green/brown landscape colors
        const isGreenish = g > r && g > b
        const isBrownish = r > b && g > b * 1.2
        const isLowerPortion = y > height * 0.75
        
        if ((isGreenish || isBrownish) && isLowerPortion) {
          mask[index] = 6 // Landscape class
        }
      }
    }
    
    return mask
  }

  // Helper methods
  private hasStrongEdgesNearby(edges: number[], x: number, y: number, width: number, height: number, radius: number): boolean {
    let edgeCount = 0
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          if (edges[ny * width + nx] === 1) edgeCount++
        }
      }
    }
    return edgeCount > radius
  }

  private hasVerticalEdgesNearby(edges: number[], x: number, y: number, width: number, height: number): boolean {
    // Check for vertical edge patterns
    for (let dy = -3; dy <= 3; dy++) {
      const ny = y + dy
      if (ny >= 0 && ny < height) {
        if (edges[ny * width + x] === 1) return true
      }
    }
    return false
  }

  private isReflectiveArea(pixels: Uint8ClampedArray, x: number, y: number, width: number, _height: number): boolean {
    const index = y * width + x
    const pixelIndex = index * 4
    
    const r = pixels[pixelIndex]
    const g = pixels[pixelIndex + 1]
    const b = pixels[pixelIndex + 2]
    
    // Check for reflective (glass-like) properties - often blue-ish and bright
    const isBlueish = b > r * 1.1 && b > g * 1.1
    const isNeutral = Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30
    
    return isBlueish || isNeutral
  }

  private hasDoorColor(pixels: Uint8ClampedArray, x: number, y: number, width: number): boolean {
    const index = y * width + x
    const pixelIndex = index * 4
    
    const r = pixels[pixelIndex]
    const g = pixels[pixelIndex + 1]
    const b = pixels[pixelIndex + 2]
    
    // Doors are often brown, white, or dark colors
    const isBrown = r > g && r > b && g > b
    const isWhite = r > 200 && g > 200 && b > 200
    const isDark = r < 100 && g < 100 && b < 100
    
    return isBrown || isWhite || isDark
  }

  private calculateConfidence(mask: Uint8Array): number {
    const totalPixels = mask.length
    const filledPixels = mask.filter(pixel => pixel > 0).length
    return filledPixels / totalPixels
  }



  getClassById(id: number): SegmentationClass | undefined {
    return SEGMENTATION_CLASSES.find(c => c.id === id)
  }

  getAllClasses(): SegmentationClass[] {
    return SEGMENTATION_CLASSES
  }
}

export const segmentationService = new SegmentationService()