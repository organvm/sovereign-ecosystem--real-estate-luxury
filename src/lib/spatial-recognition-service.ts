import type { MeasurementPreset } from './types'

export interface RoomTemplate {
  id: string
  name: string
  icon: string
  description: string
  typicalDimensions: {
    width: { min: number; max: number; typical: number }
    length: { min: number; max: number; typical: number }
    height: { min: number; max: number; typical: number }
  }
  measurements: MeasurementPreset[]
  spatialFeatures: string[]
  confidence?: number
}

export interface SpatialAnalysis {
  detectedRoomType: string
  confidence: number
  suggestedTemplate: RoomTemplate
  dimensions: {
    width: number
    length: number
    height: number
    area: number
    volume: number
  }
  matchedFeatures: string[]
}

class SpatialRecognitionService {
  private roomTemplates: RoomTemplate[] = [
    {
      id: 'kitchen',
      name: 'Kitchen',
      icon: '🍳',
      description: 'Standard residential kitchen',
      typicalDimensions: {
        width: { min: 8, max: 15, typical: 10 },
        length: { min: 10, max: 20, typical: 12 },
        height: { min: 8, max: 10, typical: 9 }
      },
      spatialFeatures: ['counters', 'cabinets', 'appliances', 'sink'],
      measurements: [
        {
          id: 'kitchen-width',
          name: 'Kitchen Width',
          description: 'Wall-to-wall width',
          defaultLength: 10,
          icon: '↔️',
          createdAt: new Date().toISOString()
        },
        {
          id: 'kitchen-length',
          name: 'Kitchen Length',
          description: 'Front-to-back length',
          defaultLength: 12,
          icon: '↕️',
          createdAt: new Date().toISOString()
        },
        {
          id: 'counter-height',
          name: 'Counter Height',
          description: 'Standard counter height',
          defaultLength: 3,
          icon: '📏',
          createdAt: new Date().toISOString()
        },
        {
          id: 'island-width',
          name: 'Island Width',
          description: 'Kitchen island width',
          defaultLength: 4,
          icon: '🏝️',
          createdAt: new Date().toISOString()
        },
        {
          id: 'cabinet-depth',
          name: 'Cabinet Depth',
          description: 'Base cabinet depth',
          defaultLength: 2,
          icon: '📦',
          createdAt: new Date().toISOString()
        }
      ]
    },
    {
      id: 'bedroom',
      name: 'Bedroom',
      icon: '🛏️',
      description: 'Standard residential bedroom',
      typicalDimensions: {
        width: { min: 10, max: 16, typical: 12 },
        length: { min: 10, max: 18, typical: 14 },
        height: { min: 8, max: 10, typical: 9 }
      },
      spatialFeatures: ['bed', 'closet', 'window', 'door'],
      measurements: [
        {
          id: 'bedroom-width',
          name: 'Bedroom Width',
          description: 'Wall-to-wall width',
          defaultLength: 12,
          icon: '↔️',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bedroom-length',
          name: 'Bedroom Length',
          description: 'Front-to-back length',
          defaultLength: 14,
          icon: '↕️',
          createdAt: new Date().toISOString()
        },
        {
          id: 'closet-width',
          name: 'Closet Width',
          description: 'Closet opening width',
          defaultLength: 6,
          icon: '🚪',
          createdAt: new Date().toISOString()
        },
        {
          id: 'window-width',
          name: 'Window Width',
          description: 'Window opening width',
          defaultLength: 4,
          icon: '🪟',
          createdAt: new Date().toISOString()
        }
      ]
    },
    {
      id: 'bathroom',
      name: 'Bathroom',
      icon: '🚿',
      description: 'Standard residential bathroom',
      typicalDimensions: {
        width: { min: 5, max: 10, typical: 7 },
        length: { min: 7, max: 12, typical: 9 },
        height: { min: 8, max: 10, typical: 9 }
      },
      spatialFeatures: ['toilet', 'sink', 'shower', 'tub'],
      measurements: [
        {
          id: 'bathroom-width',
          name: 'Bathroom Width',
          description: 'Wall-to-wall width',
          defaultLength: 7,
          icon: '↔️',
          createdAt: new Date().toISOString()
        },
        {
          id: 'bathroom-length',
          name: 'Bathroom Length',
          description: 'Front-to-back length',
          defaultLength: 9,
          icon: '↕️',
          createdAt: new Date().toISOString()
        },
        {
          id: 'shower-width',
          name: 'Shower Width',
          description: 'Shower stall width',
          defaultLength: 3,
          icon: '🚿',
          createdAt: new Date().toISOString()
        },
        {
          id: 'vanity-width',
          name: 'Vanity Width',
          description: 'Bathroom vanity width',
          defaultLength: 4,
          icon: '🪞',
          createdAt: new Date().toISOString()
        }
      ]
    },
    {
      id: 'living-room',
      name: 'Living Room',
      icon: '🛋️',
      description: 'Standard residential living room',
      typicalDimensions: {
        width: { min: 12, max: 20, typical: 15 },
        length: { min: 14, max: 24, typical: 18 },
        height: { min: 8, max: 12, typical: 9 }
      },
      spatialFeatures: ['sofa', 'tv', 'window', 'fireplace'],
      measurements: [
        {
          id: 'living-width',
          name: 'Living Room Width',
          description: 'Wall-to-wall width',
          defaultLength: 15,
          icon: '↔️',
          createdAt: new Date().toISOString()
        },
        {
          id: 'living-length',
          name: 'Living Room Length',
          description: 'Front-to-back length',
          defaultLength: 18,
          icon: '↕️',
          createdAt: new Date().toISOString()
        },
        {
          id: 'tv-wall-width',
          name: 'TV Wall Width',
          description: 'Entertainment wall width',
          defaultLength: 8,
          icon: '📺',
          createdAt: new Date().toISOString()
        },
        {
          id: 'window-wall',
          name: 'Window Wall Length',
          description: 'Length of windowed wall',
          defaultLength: 10,
          icon: '🪟',
          createdAt: new Date().toISOString()
        }
      ]
    },
    {
      id: 'dining-room',
      name: 'Dining Room',
      icon: '🍽️',
      description: 'Standard residential dining room',
      typicalDimensions: {
        width: { min: 10, max: 16, typical: 12 },
        length: { min: 12, max: 18, typical: 14 },
        height: { min: 8, max: 10, typical: 9 }
      },
      spatialFeatures: ['table', 'chairs', 'chandelier', 'buffet'],
      measurements: [
        {
          id: 'dining-width',
          name: 'Dining Room Width',
          description: 'Wall-to-wall width',
          defaultLength: 12,
          icon: '↔️',
          createdAt: new Date().toISOString()
        },
        {
          id: 'dining-length',
          name: 'Dining Room Length',
          description: 'Front-to-back length',
          defaultLength: 14,
          icon: '↕️',
          createdAt: new Date().toISOString()
        },
        {
          id: 'table-space',
          name: 'Table Space',
          description: 'Dining table area',
          defaultLength: 6,
          icon: '🪑',
          createdAt: new Date().toISOString()
        }
      ]
    },
    {
      id: 'office',
      name: 'Home Office',
      icon: '💼',
      description: 'Standard home office or study',
      typicalDimensions: {
        width: { min: 8, max: 14, typical: 10 },
        length: { min: 10, max: 16, typical: 12 },
        height: { min: 8, max: 10, typical: 9 }
      },
      spatialFeatures: ['desk', 'bookshelf', 'window', 'filing'],
      measurements: [
        {
          id: 'office-width',
          name: 'Office Width',
          description: 'Wall-to-wall width',
          defaultLength: 10,
          icon: '↔️',
          createdAt: new Date().toISOString()
        },
        {
          id: 'office-length',
          name: 'Office Length',
          description: 'Front-to-back length',
          defaultLength: 12,
          icon: '↕️',
          createdAt: new Date().toISOString()
        },
        {
          id: 'desk-wall',
          name: 'Desk Wall Length',
          description: 'Length for desk placement',
          defaultLength: 6,
          icon: '🖥️',
          createdAt: new Date().toISOString()
        }
      ]
    },
    {
      id: 'hallway',
      name: 'Hallway',
      icon: '🚪',
      description: 'Standard residential hallway',
      typicalDimensions: {
        width: { min: 3, max: 5, typical: 4 },
        length: { min: 6, max: 20, typical: 10 },
        height: { min: 8, max: 10, typical: 9 }
      },
      spatialFeatures: ['doors', 'walls', 'narrow'],
      measurements: [
        {
          id: 'hallway-width',
          name: 'Hallway Width',
          description: 'Corridor width',
          defaultLength: 4,
          icon: '↔️',
          createdAt: new Date().toISOString()
        },
        {
          id: 'hallway-length',
          name: 'Hallway Length',
          description: 'Total corridor length',
          defaultLength: 10,
          icon: '↕️',
          createdAt: new Date().toISOString()
        },
        {
          id: 'door-spacing',
          name: 'Door Spacing',
          description: 'Distance between doors',
          defaultLength: 5,
          icon: '🚪',
          createdAt: new Date().toISOString()
        }
      ]
    },
    {
      id: 'closet',
      name: 'Walk-in Closet',
      icon: '👔',
      description: 'Walk-in closet space',
      typicalDimensions: {
        width: { min: 5, max: 10, typical: 6 },
        length: { min: 5, max: 12, typical: 8 },
        height: { min: 8, max: 10, typical: 9 }
      },
      spatialFeatures: ['rods', 'shelves', 'narrow', 'storage'],
      measurements: [
        {
          id: 'closet-width',
          name: 'Closet Width',
          description: 'Wall-to-wall width',
          defaultLength: 6,
          icon: '↔️',
          createdAt: new Date().toISOString()
        },
        {
          id: 'closet-depth',
          name: 'Closet Depth',
          description: 'Front-to-back depth',
          defaultLength: 8,
          icon: '↕️',
          createdAt: new Date().toISOString()
        },
        {
          id: 'rod-length',
          name: 'Rod Length',
          description: 'Hanging rod length',
          defaultLength: 5,
          icon: '📏',
          createdAt: new Date().toISOString()
        }
      ]
    }
  ]

  analyzeSpace(width: number, length: number, height: number): SpatialAnalysis {
    const area = width * length
    const volume = area * height
    
    let bestMatch: RoomTemplate | null = null
    let highestScore = 0

    for (const template of this.roomTemplates) {
      const score = this.calculateMatchScore(template, width, length, height)
      
      if (score > highestScore) {
        highestScore = score
        bestMatch = template
      }
    }

    if (!bestMatch) {
      bestMatch = this.roomTemplates[0]
    }

    const confidence = Math.min(highestScore * 100, 95)

    return {
      detectedRoomType: bestMatch.name,
      confidence,
      suggestedTemplate: { ...bestMatch, confidence },
      dimensions: {
        width,
        length,
        height,
        area,
        volume
      },
      matchedFeatures: bestMatch.spatialFeatures
    }
  }

  private calculateMatchScore(template: RoomTemplate, width: number, length: number, height: number): number {
    const { typicalDimensions } = template
    
    const widthScore = this.getDimensionScore(
      width,
      typicalDimensions.width.min,
      typicalDimensions.width.max,
      typicalDimensions.width.typical
    )
    
    const lengthScore = this.getDimensionScore(
      length,
      typicalDimensions.length.min,
      typicalDimensions.length.max,
      typicalDimensions.length.typical
    )
    
    const heightScore = this.getDimensionScore(
      height,
      typicalDimensions.height.min,
      typicalDimensions.height.max,
      typicalDimensions.height.typical
    )

    const aspectRatio = Math.max(width, length) / Math.min(width, length)
    const typicalAspectRatio = Math.max(
      typicalDimensions.width.typical,
      typicalDimensions.length.typical
    ) / Math.min(
      typicalDimensions.width.typical,
      typicalDimensions.length.typical
    )
    
    const aspectRatioScore = 1 - Math.min(Math.abs(aspectRatio - typicalAspectRatio) / typicalAspectRatio, 1)

    return (widthScore * 0.3 + lengthScore * 0.3 + heightScore * 0.2 + aspectRatioScore * 0.2)
  }

  private getDimensionScore(value: number, min: number, max: number, typical: number): number {
    if (value < min || value > max) {
      const distance = value < min ? min - value : value - max
      return Math.max(0, 1 - (distance / typical))
    }

    const distanceFromTypical = Math.abs(value - typical)
    const range = max - min
    
    return Math.max(0, 1 - (distanceFromTypical / (range / 2)))
  }

  getRoomTemplates(): RoomTemplate[] {
    return this.roomTemplates
  }

  getTemplateById(id: string): RoomTemplate | undefined {
    return this.roomTemplates.find(t => t.id === id)
  }

  getTemplateByName(name: string): RoomTemplate | undefined {
    return this.roomTemplates.find(
      t => t.name.toLowerCase() === name.toLowerCase()
    )
  }

  suggestMeasurements(roomType: string): MeasurementPreset[] {
    const template = this.getTemplateByName(roomType)
    return template ? template.measurements : []
  }
}

export const spatialRecognitionService = new SpatialRecognitionService()
