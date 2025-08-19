// Claude Vision Service for Product Location Analysis
import { supabase } from '../supabaseClient'

interface ProductAnalysis {
  products: Array<{
    name: string
    confidence: number
    position: 'left' | 'right' | 'center'
    shelfLevel: 'top' | 'middle' | 'bottom' | 'unknown'
  }>
  aisleNumber?: string
  aisleDescription?: string
  storeChain?: string
  additionalInfo?: string
}

interface AnalysisResult {
  success: boolean
  data?: ProductAnalysis
  error?: string
  tokensUsed?: number
  cost?: number
}

class ClaudeVisionService {
  private apiKey: string
  private baseUrl = 'https://api.anthropic.com/v1/messages'
  
  constructor() {
    // In production, this would come from environment variables
    this.apiKey = process.env.REACT_APP_CLAUDE_API_KEY || ''
  }

  /**
   * Compress image to reduce API costs
   */
  private async compressImage(file: File): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Reduce size to max 800px width while maintaining aspect ratio
        const maxWidth = 800
        const scale = Math.min(1, maxWidth / img.width)
        
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        // Convert to base64 with reduced quality
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7)
        resolve(compressedDataUrl.split(',')[1]) // Remove data:image/jpeg;base64, prefix
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Analyze store photo for product locations
   */
  async analyzeStorePhoto(photoFile: File): Promise<AnalysisResult> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'Claude API key not configured. This is a demo feature.'
        }
      }

      // Compress image to reduce costs
      const base64Image = await this.compressImage(photoFile)
      
      const prompt = `Analyze this grocery store photo and extract product information in JSON format.

Look for:
1. Any aisle number signs (like "Aisle 5" or "5")
2. Product names visible on shelves or price tags
3. Store chain indicators (Tesco, ASDA, Sainsburys, etc.)
4. Product positions relative to aisle sides
5. Shelf levels (top/middle/bottom)

Return a JSON object with this exact structure:
{
  "products": [
    {
      "name": "product name",
      "confidence": 0.8,
      "position": "left|right|center",
      "shelfLevel": "top|middle|bottom|unknown"
    }
  ],
  "aisleNumber": "5",
  "aisleDescription": "Dairy & Eggs",
  "storeChain": "Tesco",
  "additionalInfo": "Any other relevant observations"
}

Only include products you can clearly identify. Use confidence scores from 0.1 (unsure) to 1.0 (certain).`

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Image
                }
              }
            ]
          }]
        })
      })

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      const analysisText = result.content[0].text

      // Extract JSON from Claude's response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Could not parse JSON from Claude response')
      }

      const analysis: ProductAnalysis = JSON.parse(jsonMatch[0])
      
      // Calculate approximate cost
      const inputTokens = result.usage?.input_tokens || 1000
      const outputTokens = result.usage?.output_tokens || 200
      const cost = (inputTokens * 0.003 + outputTokens * 0.015) / 1000 // Rough estimate

      // Log analysis for debugging
      console.log('🔍 Claude Vision Analysis:', {
        products: analysis.products?.length || 0,
        aisle: analysis.aisleNumber,
        store: analysis.storeChain,
        cost: `$${cost.toFixed(4)}`,
        tokens: { input: inputTokens, output: outputTokens }
      })

      return {
        success: true,
        data: analysis,
        tokensUsed: inputTokens + outputTokens,
        cost
      }

    } catch (error) {
      console.error('Claude Vision analysis failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Store analysis results in database
   */
  async storeAnalysisResults(
    storeId: string, 
    photoUrl: string, 
    analysis: ProductAnalysis, 
    cost: number
  ): Promise<void> {
    try {
      // Store each product location
      if (analysis.products) {
        for (const product of analysis.products) {
          await supabase.from('product_locations').insert({
            store_id: storeId,
            product_name: product.name,
            aisle: analysis.aisleNumber || 'Unknown',
            aisle_section: this.positionToSection(product.position),
            side: product.position,
            shelf_level: product.shelfLevel,
            confidence_score: product.confidence,
            image_url: photoUrl,
            extracted_by: 'claude_vision',
            extraction_cost: cost,
            created_at: new Date().toISOString()
          })
        }
      }

      // Log usage for monitoring costs
      await supabase.from('claude_vision_usage').insert({
        store_id: storeId,
        image_url: photoUrl,
        products_extracted: analysis.products?.length || 0,
        cost_usd: cost,
        aisle_detected: analysis.aisleNumber,
        store_chain: analysis.storeChain,
        created_at: new Date().toISOString()
      })

    } catch (error) {
      console.error('Failed to store analysis results:', error)
      throw error
    }
  }

  private positionToSection(position: string): string {
    switch (position) {
      case 'left': return 'start'
      case 'center': return 'middle'  
      case 'right': return 'end'
      default: return 'unknown'
    }
  }

  /**
   * Get total usage and costs for monitoring
   */
  async getUsageStats(): Promise<{
    totalCost: number
    totalImages: number
    totalProducts: number
    todaysCost: number
  }> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data: totalStats } = await supabase
        .from('claude_vision_usage')
        .select('cost_usd, products_extracted')
      
      const { data: todayStats } = await supabase
        .from('claude_vision_usage')
        .select('cost_usd')
        .gte('created_at', today)
      
      return {
        totalCost: totalStats?.reduce((sum, row) => sum + (row.cost_usd || 0), 0) || 0,
        totalImages: totalStats?.length || 0,
        totalProducts: totalStats?.reduce((sum, row) => sum + (row.products_extracted || 0), 0) || 0,
        todaysCost: todayStats?.reduce((sum, row) => sum + (row.cost_usd || 0), 0) || 0
      }
    } catch (error) {
      console.error('Failed to get usage stats:', error)
      return { totalCost: 0, totalImages: 0, totalProducts: 0, todaysCost: 0 }
    }
  }
}

export const claudeVisionService = new ClaudeVisionService()
export type { ProductAnalysis, AnalysisResult }