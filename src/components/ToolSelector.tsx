import React from 'react'
import { SEGMENTATION_CLASSES } from '../services/segmentation'

interface ToolSelectorProps {
  selectedTool: 'ai' | 'brush' | 'eraser' | 'polygon'
  onToolChange: (tool: 'ai' | 'brush' | 'eraser' | 'polygon') => void
  brushSize: number
  onBrushSizeChange: (size: number) => void
  selectedClass: number
  onClassChange: (classId: number) => void
}

export const ToolSelector: React.FC<ToolSelectorProps> = ({
  selectedTool,
  onToolChange,
  brushSize,
  onBrushSizeChange,
  selectedClass,
  onClassChange
}) => {
  const tools = [
    { id: 'ai' as const, name: 'AI Detection', icon: '🤖', description: 'Automatic detection' },
    { id: 'brush' as const, name: 'Brush', icon: '🖌️', description: 'Paint areas manually' },
    { id: 'polygon' as const, name: 'Polygon', icon: '📐', description: 'Draw precise shapes' },
    { id: 'eraser' as const, name: 'Eraser', icon: '🧽', description: 'Remove selections' }
  ]

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Selection Tools</h3>
      
      {/* Tool Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            className={`p-3 rounded-lg border transition-colors ${
              selectedTool === tool.id
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="text-2xl mb-1">{tool.icon}</div>
            <div className="text-sm font-medium">{tool.name}</div>
            <div className="text-xs text-gray-500">{tool.description}</div>
          </button>
        ))}
      </div>

      {/* Brush Size (for manual tools) */}
      {(selectedTool === 'brush' || selectedTool === 'eraser') && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Brush Size: {brushSize}px
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      {/* Class Selection (for manual tools) */}
      {selectedTool !== 'ai' && selectedTool !== 'eraser' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Select Area Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SEGMENTATION_CLASSES
              .filter(segClass => segClass.id !== 0) // Exclude background
              .map(segClass => (
                <button
                  key={segClass.id}
                  onClick={() => onClassChange(segClass.id)}
                  className={`flex items-center space-x-2 p-2 rounded-lg border transition-colors ${
                    selectedClass === segClass.id
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: segClass.color }}
                  />
                  <span className="text-sm font-medium">{segClass.displayName}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 p-3 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-1">Instructions:</h4>
        <div className="text-sm text-blue-700">
          {selectedTool === 'ai' && 'AI will automatically detect house features in your image.'}
          {selectedTool === 'brush' && 'Click and drag to paint areas you want to recolor.'}
          {selectedTool === 'polygon' && 'Click to add points, then complete the shape for precise selection.'}
          {selectedTool === 'eraser' && 'Click and drag to remove unwanted selections.'}
        </div>
      </div>
    </div>
  )
}