import { useState, useRef } from 'react'
import './App.css'
import { ImageUploader } from './components/ImageUploader'
import { SegmentationViewer } from './components/SegmentationViewer'
import { useImageProcessor } from './hooks/useImageProcessor'
import { useSegmentation } from './hooks/useSegmentation'
import { useAppStore } from './store'
import { ImageData } from './types'

function App() {
  const [uploadedImage, setUploadedImage] = useState<ImageData | null>(null)
  const [currentStep, setCurrentStep] = useState<'upload' | 'segment' | 'color'>('upload')
  const imageRef = useRef<HTMLImageElement>(null)
  
  const { processImageFile, isProcessing, error, clearError } = useImageProcessor()
  const { segmentImage, isSegmenting, error: segmentError } = useSegmentation()
  
  const { 
    setImage, 
    segmentation, 
    setSegmentation, 
    selectedAreas, 
    toggleSelectedArea,
    clearSelectedAreas 
  } = useAppStore()

  const handleImageUpload = async (file: File) => {
    try {
      clearError()
      const imageData = await processImageFile(file)
      setUploadedImage(imageData)
      setImage(imageData)
      setCurrentStep('segment')
    } catch (err) {
      console.error('Failed to process image:', err)
    }
  }

  const handleStartSegmentation = async () => {
    if (!uploadedImage || !imageRef.current) return
    
    try {
      const result = await segmentImage(imageRef.current)
      setSegmentation(result)
      setCurrentStep('color')
    } catch (err) {
      console.error('Segmentation failed:', err)
    }
  }

  const handleAreaSelect = (classId: number) => {
    toggleSelectedArea(classId)
  }

  const handleReset = () => {
    setUploadedImage(null)
    setSegmentation(null)
    clearSelectedAreas()
    setCurrentStep('upload')
    clearError()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">ColorMyHouse</h1>
          <p className="text-gray-600">AI-Powered House Color Visualizer</p>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {currentStep === 'upload' ? (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Upload Your House Photo
              </h2>
              <p className="text-gray-600 mb-6">
                Get started by uploading a photo of your house. We'll help you visualize different color schemes.
              </p>
              <ImageUploader 
                onImageUpload={handleImageUpload} 
                isUploading={isProcessing}
              />
              {error && (
                <div className="mt-4 flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
                  <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </div>
            
            {/* How it works */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">1. Upload</h3>
                <p className="text-blue-700 text-sm">Drag and drop your house photo or click to select from your device</p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">2. Select</h3>
                <p className="text-green-700 text-sm">Choose specific areas like walls, doors, or trim to recolor</p>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-purple-900 mb-2">3. Preview</h3>
                <p className="text-purple-700 text-sm">See your new color scheme applied in real-time</p>
              </div>
            </div>
          </>
        ) : currentStep === 'segment' ? (
          /* Segmentation step */
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  AI Segmentation
                </h2>
                <button
                  onClick={handleReset}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Start Over</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Image Preview */}
                <div className="space-y-4">
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      ref={imageRef}
                      src={uploadedImage?.url}
                      alt="Uploaded house"
                      className="w-full h-auto max-h-96 object-contain"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>Dimensions: {uploadedImage?.width} × {uploadedImage?.height}px</p>
                    <p>Ready for AI analysis</p>
                  </div>
                </div>
                
                {/* Segmentation Controls */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">AI Analysis</h3>
                  <p className="text-gray-600">
                    Our AI will automatically detect different parts of your house including walls, roof, doors, windows, and more.
                  </p>
                  
                  {segmentError && (
                    <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
                      <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">{segmentError}</span>
                    </div>
                  )}
                  
                  <button
                    onClick={handleStartSegmentation}
                    disabled={isSegmenting}
                    className={`w-full font-medium py-3 px-4 rounded-lg transition-colors ${
                      isSegmenting
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isSegmenting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Analyzing Image...</span>
                      </div>
                    ) : (
                      'Start AI Segmentation'
                    )}
                  </button>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">What we'll detect:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Exterior walls</li>
                      <li>• Roof and roofing materials</li>
                      <li>• Windows and glass</li>
                      <li>• Doors and entryways</li>
                      <li>• Trim and architectural details</li>
                      <li>• Landscape elements</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Color selection step */
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Select Areas to Recolor
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentStep('segment')}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Back</span>
                  </button>
                  <button
                    onClick={handleReset}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>Start Over</span>
                  </button>
                </div>
              </div>
              
              {uploadedImage && segmentation && (
                <SegmentationViewer
                  imageUrl={uploadedImage.url}
                  imageWidth={uploadedImage.width}
                  imageHeight={uploadedImage.height}
                  segmentationResult={segmentation}
                  onAreaSelect={handleAreaSelect}
                  selectedAreas={selectedAreas}
                />
              )}
              
              {selectedAreas.length > 0 && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">
                    Ready for Color Selection
                  </h4>
                  <p className="text-sm text-green-700 mb-3">
                    You've selected {selectedAreas.length} area{selectedAreas.length !== 1 ? 's' : ''} to recolor. 
                    Next, you'll be able to choose colors and see a real-time preview.
                  </p>
                  <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                    Choose Colors
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App