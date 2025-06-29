import { useState, useCallback } from 'react'
import { ImageData } from '../types'

export const useImageProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processImageFile = useCallback((file: File): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
      setIsProcessing(true)
      setError(null)

      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const imageData: ImageData = {
            id: Date.now().toString(),
            url: e.target?.result as string,
            originalUrl: e.target?.result as string,
            width: img.width,
            height: img.height,
          }
          setIsProcessing(false)
          resolve(imageData)
        }
        img.onerror = () => {
          setIsProcessing(false)
          setError('Failed to load image')
          reject(new Error('Failed to load image'))
        }
        img.src = e.target?.result as string
      }
      reader.onerror = () => {
        setIsProcessing(false)
        setError('Failed to read file')
        reject(new Error('Failed to read file'))
      }
      reader.readAsDataURL(file)
    })
  }, [])

  const validateImageFile = useCallback((file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/heif', 'image/heic']
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload JPG, PNG, or HEIF images.')
      return false
    }

    if (file.size > maxSize) {
      setError('File too large. Please upload images smaller than 10MB.')
      return false
    }

    return true
  }, [])

  return {
    processImageFile,
    validateImageFile,
    isProcessing,
    error,
    clearError: () => setError(null),
  }
}