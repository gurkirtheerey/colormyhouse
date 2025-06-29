import { useState, useCallback } from 'react'
import { segmentationService, SegmentationResult } from '../services/segmentation'

export const useSegmentation = () => {
  const [isSegmenting, setIsSegmenting] = useState(false)
  const [segmentationResult, setSegmentationResult] = useState<SegmentationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const segmentImage = useCallback(async (imageElement: HTMLImageElement) => {
    try {
      setIsSegmenting(true)
      setError(null)
      
      const result = await segmentationService.segmentImage(imageElement)
      setSegmentationResult(result)
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Segmentation failed'
      setError(errorMessage)
      console.error('Segmentation error:', err)
      throw err
    } finally {
      setIsSegmenting(false)
    }
  }, [])

  const clearSegmentation = useCallback(() => {
    setSegmentationResult(null)
    setError(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    segmentImage,
    clearSegmentation,
    clearError,
    isSegmenting,
    segmentationResult,
    error,
    hasSegmentation: segmentationResult !== null
  }
}