const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export interface ApiResponse<T> {
  data: T
  success: boolean
  error?: string
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      const data = await response.json()
      
      if (!response.ok) {
        return {
          data: data,
          success: false,
          error: data.message || 'An error occurred',
        }
      }

      return {
        data,
        success: true,
      }
    } catch (error) {
      return {
        data: {} as T,
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  async uploadImage(file: File): Promise<ApiResponse<{ url: string; id: string }>> {
    const formData = new FormData()
    formData.append('image', file)

    return this.request('/images/upload', {
      method: 'POST',
      headers: {},
      body: formData,
    })
  }

  async processColorChange(data: {
    imageId: string
    selections: unknown[]
    color: unknown
  }): Promise<ApiResponse<{ processedImageUrl: string }>> {
    return this.request('/process/color-change', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async autoSegment(imageId: string): Promise<ApiResponse<{ segments: unknown[] }>> {
    return this.request('/segment/auto', {
      method: 'POST',
      body: JSON.stringify({ imageId }),
    })
  }
}

export const apiService = new ApiService()