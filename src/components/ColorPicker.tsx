import React, { useState, useCallback, useEffect } from 'react'
import { Color } from '../types'
import { colorProcessor } from '../services/colorProcessor'

interface ColorPickerProps {
  initialColor?: Color
  onColorChange: (color: Color) => void
  onIntensityChange?: (intensity: number) => void
  intensity?: number
  originalColor?: string
  disabled?: boolean
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  initialColor = { hue: 0, saturation: 100, lightness: 50, hex: '#ff0000' },
  onColorChange,
  onIntensityChange,
  intensity = 1,
  originalColor,
  disabled = false
}) => {
  const [color, setColor] = useState<Color>(initialColor)
  const [recommendations, setRecommendations] = useState<string[]>([])

  // Popular house colors for quick selection
  const popularColors = [
    '#F5F5DC', // Beige
    '#FFFFFF', // White
    '#D2B48C', // Tan
    '#8B7355', // Dark Khaki
    '#696969', // Dim Gray
    '#2F4F4F', // Dark Slate Gray
    '#8B4513', // Saddle Brown
    '#CD853F', // Peru
    '#A0522D', // Sienna
    '#228B22', // Forest Green
    '#4682B4', // Steel Blue
    '#B22222', // Fire Brick
    '#800080', // Purple
    '#FF6347', // Tomato
    '#FFD700', // Gold
    '#FF4500'  // Orange Red
  ]

  // Update recommendations when original color changes
  useEffect(() => {
    if (originalColor) {
      const newRecommendations = colorProcessor.getColorRecommendations(originalColor)
      setRecommendations(newRecommendations)
    }
  }, [originalColor])

  const hslToHex = (h: number, s: number, l: number): string => {
    s /= 100
    l /= 100
    const k = (n: number) => (n + h / 30) % 12
    const a = s * Math.min(l, 1 - l)
    const f = (n: number) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
    
    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }
    
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`
  }

  const handleColorSelect = useCallback((hexColor: string) => {
    const rgb = colorProcessor.hexToRgb(hexColor)
    const hsl = colorProcessor.rgbToHsl(rgb.r, rgb.g, rgb.b)
    const newColor = {
      hue: hsl.h,
      saturation: hsl.s,
      lightness: hsl.l,
      hex: hexColor
    }
    setColor(newColor)
    onColorChange(newColor)
  }, [onColorChange])

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    const hue = parseInt(e.target.value)
    const newColor = {
      ...color,
      hue,
      hex: hslToHex(hue, color.saturation, color.lightness)
    }
    setColor(newColor)
    onColorChange(newColor)
  }

  const handleSaturationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    const saturation = parseInt(e.target.value)
    const newColor = {
      ...color,
      saturation,
      hex: hslToHex(color.hue, saturation, color.lightness)
    }
    setColor(newColor)
    onColorChange(newColor)
  }

  const handleLightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    const lightness = parseInt(e.target.value)
    const newColor = {
      ...color,
      lightness,
      hex: hslToHex(color.hue, color.saturation, lightness)
    }
    setColor(newColor)
    onColorChange(newColor)
  }

  const handleIntensityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    const newIntensity = parseFloat(e.target.value)
    onIntensityChange?.(newIntensity)
  }, [onIntensityChange, disabled])

  const handleDirectColorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    const hexColor = e.target.value
    if (/^#[0-9A-F]{6}$/i.test(hexColor)) {
      handleColorSelect(hexColor)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Choose Color</h3>
        {originalColor && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Original:</span>
            <div 
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: originalColor }}
            />
          </div>
        )}
      </div>

      {/* Current Color Display */}
      <div className="flex items-center space-x-4">
        <div className="flex flex-col items-center space-y-2">
          <div 
            className="w-16 h-16 rounded-lg border-2 border-gray-300 shadow-sm"
            style={{ backgroundColor: color.hex }}
          />
          <span className="text-sm font-medium text-gray-700">Selected</span>
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Color
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={color.hex}
              onChange={(e) => handleColorSelect(e.target.value)}
              disabled={disabled}
              className="w-12 h-10 rounded border border-gray-300 cursor-pointer disabled:cursor-not-allowed"
            />
            <input
              type="text"
              value={color.hex}
              onChange={handleDirectColorInput}
              disabled={disabled}
              placeholder="#FFFFFF"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-sm"
            />
          </div>
        </div>
      </div>

      {/* HSL Sliders */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hue
          </label>
          <input
            type="range"
            min="0"
            max="360"
            value={color.hue}
            onChange={handleHueChange}
            disabled={disabled}
            className="w-full disabled:cursor-not-allowed"
            style={{
              background: disabled ? '#e5e7eb' : `linear-gradient(to right, 
                hsl(0, 100%, 50%), 
                hsl(60, 100%, 50%), 
                hsl(120, 100%, 50%), 
                hsl(180, 100%, 50%), 
                hsl(240, 100%, 50%), 
                hsl(300, 100%, 50%), 
                hsl(360, 100%, 50%))`
            }}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Saturation
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={color.saturation}
            onChange={handleSaturationChange}
            disabled={disabled}
            className="w-full disabled:cursor-not-allowed"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lightness
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={color.lightness}
            onChange={handleLightnessChange}
            disabled={disabled}
            className="w-full disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Color Intensity Slider */}
      {onIntensityChange && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Color Intensity
            </label>
            <span className="text-sm text-gray-500">{Math.round(intensity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={intensity}
            onChange={handleIntensityChange}
            disabled={disabled}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Subtle</span>
            <span>Strong</span>
          </div>
        </div>
      )}

      {/* Popular Colors */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Popular House Colors</h4>
        <div className="grid grid-cols-8 gap-2">
          {popularColors.map((hexColor, index) => (
            <button
              key={index}
              onClick={() => !disabled && handleColorSelect(hexColor)}
              disabled={disabled}
              className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 disabled:cursor-not-allowed ${
                color.hex === hexColor
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{ backgroundColor: hexColor }}
              title={hexColor}
            />
          ))}
        </div>
      </div>

      {/* Color Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Recommended Colors</h4>
          <div className="grid grid-cols-6 gap-2">
            {recommendations.map((hexColor, index) => (
              <button
                key={index}
                onClick={() => !disabled && handleColorSelect(hexColor)}
                disabled={disabled}
                className={`w-10 h-10 rounded border-2 transition-all hover:scale-110 disabled:cursor-not-allowed ${
                  color.hex === hexColor
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: hexColor }}
                title={hexColor}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Tip: Colors preserve shadows and textures
        </div>
        {originalColor && (
          <button
            onClick={() => !disabled && handleColorSelect(originalColor)}
            disabled={disabled}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
          >
            Reset to Original
          </button>
        )}
      </div>
    </div>
  )
}