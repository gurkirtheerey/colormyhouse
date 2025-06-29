import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface ImageUploaderProps {
  onImageUpload: (file: File) => void
  isUploading?: boolean
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageUpload, 
  isUploading = false 
}) => {
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: unknown[]) => {
    setError(null)
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0] as { errors: { code: string }[] }
      if (rejection.errors.some((e) => e.code === 'file-too-large')) {
        setError('File is too large. Please select an image smaller than 10MB.')
      } else if (rejection.errors.some((e) => e.code === 'file-invalid-type')) {
        setError('Invalid file type. Please select a JPG, PNG, or HEIF image.')
      } else {
        setError('Invalid file. Please try another image.')
      }
      return
    }
    
    if (acceptedFiles.length > 0) {
      onImageUpload(acceptedFiles[0])
    }
  }, [onImageUpload])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/heif': ['.heif', '.heic']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: isUploading
  })

  const getBorderColor = () => {
    if (isDragReject) return 'border-red-500 bg-red-50'
    if (isDragActive) return 'border-blue-500 bg-blue-50'
    if (error) return 'border-red-300'
    return 'border-gray-300 hover:border-gray-400'
  }

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isUploading 
            ? 'cursor-not-allowed opacity-50 border-gray-300' 
            : 'cursor-pointer'
        } ${getBorderColor()}`}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-sm text-gray-600">Processing image...</p>
          </div>
        ) : (
          <>
            <svg
              className={`mx-auto h-12 w-12 ${
                isDragReject ? 'text-red-400' : 
                isDragActive ? 'text-blue-500' : 'text-gray-400'
              }`}
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className={`mt-2 text-sm ${
              isDragReject ? 'text-red-600' :
              isDragActive ? 'text-blue-600' : 'text-gray-600'
            }`}>
              {isDragReject
                ? 'Invalid file type'
                : isDragActive
                ? 'Drop the image here...'
                : 'Drag and drop an image here, or click to select'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              JPG, PNG, or HEIF up to 10MB
            </p>
          </>
        )}
      </div>
      
      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
          <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  )
}