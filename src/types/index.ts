export interface ImageData {
  id: string
  url: string
  width: number
  height: number
  originalUrl: string
}

export interface Selection {
  id: string
  name: string
  points: number[]
  color?: Color
  type: 'walls' | 'roof' | 'doors' | 'windows' | 'landscape' | 'sky'
}

export interface Color {
  hue: number
  saturation: number
  lightness: number
  hex: string
}

export interface HistoryItem {
  id: string
  timestamp: number
  action: string
  data: unknown
}

export type Tool = 'select' | 'brush' | 'eraser' | 'colorPicker' | 'pan' | 'zoom'

export interface Project {
  id: string
  name: string
  image: ImageData
  selections: Selection[]
  history: HistoryItem[]
  createdAt: Date
  updatedAt: Date
}

export interface AppState {
  project: {
    id: string
    image: ImageData
    selections: Selection[]
    history: HistoryItem[]
  }
  ui: {
    activeTool: Tool
    selectedColor: Color
    zoom: number
  }
}