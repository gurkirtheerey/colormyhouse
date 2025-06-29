import * as tf from '@tensorflow/tfjs'

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
      // Convert image to tensor
      const imageTensor = tf.browser.fromPixels(imageElement)
      const resized = tf.image.resizeBilinear(imageTensor, [512, 512])
      const normalized = resized.div(255.0)
      const batched = normalized.expandDims(0)

      // For now, create mock segmentation masks
      const mockResult = await this.createMockSegmentation(imageElement.width, imageElement.height)

      // Clean up tensors
      imageTensor.dispose()
      resized.dispose()
      normalized.dispose()
      batched.dispose()

      return mockResult
    } catch (error) {
      console.error('Segmentation failed:', error)
      throw error
    }
  }

  private async createMockSegmentation(width: number, height: number): Promise<SegmentationResult> {
    // Create realistic mock segmentation masks with proper shapes
    const masks: SegmentationMask[] = []
    
    // Create a single composite mask for all objects
    const compositeMask = new Uint8Array(width * height)
    
    // Sky - irregular natural shape
    this.createSkyMask(compositeMask, width, height, 7)
    
    // Roof - triangular/trapezoidal shape
    this.createRoofMask(compositeMask, width, height, 2)
    
    // Walls - house facade shape
    this.createWallsMask(compositeMask, width, height, 1)
    
    // Windows - rectangular with precise edges
    this.createWindowMask(compositeMask, width, height, 3, 0.2, 0.4, 0.15, 0.2) // Left window
    this.createWindowMask(compositeMask, width, height, 3, 0.65, 0.4, 0.15, 0.2) // Right window
    
    // Door - arched or rectangular door shape
    this.createDoorMask(compositeMask, width, height, 4)
    
    // Landscape - natural ground contour
    this.createLandscapeMask(compositeMask, width, height, 6)
    
    // Create individual masks for each class
    const classIds = [1, 2, 3, 4, 6, 7] // All classes except background
    const confidences: { [key: number]: number } = { 1: 0.94, 2: 0.91, 3: 0.88, 4: 0.92, 6: 0.79, 7: 0.96 }
    
    for (const classId of classIds) {
      const mask = new Uint8Array(width * height)
      for (let i = 0; i < compositeMask.length; i++) {
        if (compositeMask[i] === classId) {
          mask[i] = classId
        }
      }
      
      const segClass = SEGMENTATION_CLASSES.find(c => c.id === classId)!
      masks.push({
        data: mask,
        width,
        height,
        classId,
        className: segClass.name,
        confidence: confidences[classId] || 0.85
      })
    }

    return {
      masks,
      classes: SEGMENTATION_CLASSES
    }
  }

  private createSkyMask(mask: Uint8Array, width: number, height: number, classId: number): void {
    const skyHeight = Math.floor(height * 0.18) // Sky takes up top 18%
    for (let y = 0; y < skyHeight; y++) {
      // Create irregular sky boundary
      const boundaryVariation = Math.sin(y * 0.1) * 3 + Math.sin(y * 0.05) * 5
      const adjustedHeight = skyHeight + boundaryVariation
      if (y < adjustedHeight) {
        for (let x = 0; x < width; x++) {
          mask[y * width + x] = classId
        }
      }
    }
  }

  private createRoofMask(mask: Uint8Array, width: number, height: number, classId: number): void {
    const roofTop = Math.floor(height * 0.15)
    const roofBottom = Math.floor(height * 0.35)
    const roofCenterX = width / 2
    
    for (let y = roofTop; y < roofBottom; y++) {
      const progress = (y - roofTop) / (roofBottom - roofTop)
      // Create triangular/trapezoidal roof shape
      const roofWidth = width * (0.2 + progress * 0.6) // Starts narrow, gets wider
      const leftEdge = roofCenterX - roofWidth / 2
      const rightEdge = roofCenterX + roofWidth / 2
      
      for (let x = Math.floor(leftEdge); x < Math.floor(rightEdge); x++) {
        if (x >= 0 && x < width && mask[y * width + x] === 0) {
          // Add roof texture variation
          if (Math.random() > 0.05) {
            mask[y * width + x] = classId
          }
        }
      }
    }
  }

  private createWallsMask(mask: Uint8Array, width: number, height: number, classId: number): void {
    const wallTop = Math.floor(height * 0.32)
    const wallBottom = Math.floor(height * 0.75)
    const wallLeft = Math.floor(width * 0.15)
    const wallRight = Math.floor(width * 0.85)
    
    for (let y = wallTop; y < wallBottom; y++) {
      for (let x = wallLeft; x < wallRight; x++) {
        if (mask[y * width + x] === 0) { // Don't overwrite existing objects
          // Add wall texture and slight irregularities
          const noise = Math.random()
          if (noise > 0.02) { // 98% fill rate for solid walls
            mask[y * width + x] = classId
          }
        }
      }
    }
  }

  private createWindowMask(
    mask: Uint8Array, 
    width: number, 
    height: number, 
    classId: number,
    relX: number, 
    relY: number, 
    relW: number, 
    relH: number
  ): void {
    const startX = Math.floor(relX * width)
    const startY = Math.floor(relY * height)
    const endX = Math.floor((relX + relW) * width)
    const endY = Math.floor((relY + relH) * height)
    
    // Create precise rectangular window with clean edges
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          // Add window frame effect - slightly thicker edges
          const isEdge = (x === startX || x === endX - 1 || y === startY || y === endY - 1)
          const isInner = (x > startX + 2 && x < endX - 2 && y > startY + 2 && y < endY - 2)
          
          if (isEdge || isInner) {
            mask[y * width + x] = classId
          }
        }
      }
    }
  }

  private createDoorMask(mask: Uint8Array, width: number, height: number, classId: number): void {
    const doorCenterX = width / 2
    const doorWidth = Math.floor(width * 0.12)
    const doorTop = Math.floor(height * 0.52)
    const doorBottom = Math.floor(height * 0.75)
    const doorLeft = Math.floor(doorCenterX - doorWidth / 2)
    const doorRight = Math.floor(doorCenterX + doorWidth / 2)
    
    for (let y = doorTop; y < doorBottom; y++) {
      for (let x = doorLeft; x < doorRight; x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          // Create door with slight arch at top
          const distFromTop = y - doorTop
          const archHeight = 8
          if (distFromTop < archHeight) {
            // Arch calculation
            const centerDist = Math.abs(x - doorCenterX)
            const maxDist = doorWidth / 2
            const archY = Math.sqrt(Math.max(0, archHeight * archHeight - (centerDist / maxDist * archHeight) ** 2))
            if (distFromTop < archY || distFromTop >= archHeight * 0.7) {
              mask[y * width + x] = classId
            }
          } else {
            mask[y * width + x] = classId
          }
        }
      }
    }
  }

  private createLandscapeMask(mask: Uint8Array, width: number, height: number, classId: number): void {
    const landscapeStart = Math.floor(height * 0.75)
    
    for (let y = landscapeStart; y < height; y++) {
      // Create natural ground contour
      const contourVariation = Math.sin(y * 0.1) * 2 + Math.cos(y * 0.08) * 3
      const adjustedStart = landscapeStart + contourVariation
      
      if (y >= adjustedStart) {
        for (let x = 0; x < width; x++) {
          if (mask[y * width + x] === 0) { // Don't overwrite existing objects
            // Add natural variation to landscape
            if (Math.random() > 0.08) {
              mask[y * width + x] = classId
            }
          }
        }
      }
    }
  }

  getClassById(id: number): SegmentationClass | undefined {
    return SEGMENTATION_CLASSES.find(c => c.id === id)
  }

  getAllClasses(): SegmentationClass[] {
    return SEGMENTATION_CLASSES
  }
}

export const segmentationService = new SegmentationService()