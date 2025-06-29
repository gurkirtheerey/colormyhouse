import React, { useState } from 'react'
import { Color } from '../types'

interface ColorPickerProps {
  initialColor?: Color
  onColorChange: (color: Color) => void
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  initialColor = { hue: 0, saturation: 100, lightness: 50, hex: '#ff0000' },
  onColorChange
}) => {
  const [color, setColor] = useState<Color>(initialColor)

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

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const lightness = parseInt(e.target.value)
    const newColor = {
      ...color,
      lightness,
      hex: hslToHex(color.hue, color.saturation, lightness)
    }
    setColor(newColor)
    onColorChange(newColor)
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div
        className="w-full h-24 rounded-lg shadow-inner"
        style={{ backgroundColor: color.hex }}
      />
      
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
            className="w-full"
            style={{
              background: `linear-gradient(to right, 
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
            className="w-full"
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
            className="w-full"
          />
        </div>
      </div>
      
      <div className="text-center">
        <span className="text-sm font-mono text-gray-600">{color.hex}</span>
      </div>
    </div>
  )
}