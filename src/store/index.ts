import { create } from 'zustand'
import { AppState, Color, ImageData, Selection, Tool } from '../types'
import { SegmentationResult } from '../services/segmentation'

interface AppStore extends AppState {
  segmentation: SegmentationResult | null
  selectedAreas: number[]
  setImage: (image: ImageData) => void
  setActiveTool: (tool: Tool) => void
  setSelectedColor: (color: Color) => void
  setZoom: (zoom: number) => void
  addSelection: (selection: Selection) => void
  removeSelection: (id: string) => void
  updateSelection: (id: string, updates: Partial<Selection>) => void
  clearSelections: () => void
  setSegmentation: (segmentation: SegmentationResult | null) => void
  toggleSelectedArea: (classId: number) => void
  clearSelectedAreas: () => void
}

const initialColor: Color = {
  hue: 0,
  saturation: 100,
  lightness: 50,
  hex: '#ff0000'
}

export const useAppStore = create<AppStore>((set) => ({
  project: {
    id: '',
    image: {
      id: '',
      url: '',
      width: 0,
      height: 0,
      originalUrl: ''
    },
    selections: [],
    history: []
  },
  ui: {
    activeTool: 'select',
    selectedColor: initialColor,
    zoom: 1
  },
  segmentation: null,
  selectedAreas: [],
  
  setImage: (image) =>
    set((state) => ({
      project: {
        ...state.project,
        image
      }
    })),
    
  setActiveTool: (activeTool) =>
    set((state) => ({
      ui: {
        ...state.ui,
        activeTool
      }
    })),
    
  setSelectedColor: (selectedColor) =>
    set((state) => ({
      ui: {
        ...state.ui,
        selectedColor
      }
    })),
    
  setZoom: (zoom) =>
    set((state) => ({
      ui: {
        ...state.ui,
        zoom
      }
    })),
    
  addSelection: (selection) =>
    set((state) => ({
      project: {
        ...state.project,
        selections: [...state.project.selections, selection]
      }
    })),
    
  removeSelection: (id) =>
    set((state) => ({
      project: {
        ...state.project,
        selections: state.project.selections.filter(s => s.id !== id)
      }
    })),
    
  updateSelection: (id, updates) =>
    set((state) => ({
      project: {
        ...state.project,
        selections: state.project.selections.map(s =>
          s.id === id ? { ...s, ...updates } : s
        )
      }
    })),
    
  clearSelections: () =>
    set((state) => ({
      project: {
        ...state.project,
        selections: []
      }
    })),
    
  setSegmentation: (segmentation) =>
    set(() => ({
      segmentation
    })),
    
  toggleSelectedArea: (classId) =>
    set((state) => ({
      selectedAreas: state.selectedAreas.includes(classId)
        ? state.selectedAreas.filter(id => id !== classId)
        : [...state.selectedAreas, classId]
    })),
    
  clearSelectedAreas: () =>
    set(() => ({
      selectedAreas: []
    }))
}))