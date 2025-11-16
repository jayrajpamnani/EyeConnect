// OpenRouter AI Vision Service
// Provides AI-powered visual assistance using GPT-4 Vision via OpenRouter

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export interface VisionAnalysisRequest {
  imageBase64: string;
  prompt?: string;
}

export interface VisionAnalysisResponse {
  description: string;
  confidence?: number;
}

/**
 * Analyze an image using OpenRouter's vision models
 */
export async function analyzeImage(request: VisionAnalysisRequest): Promise<VisionAnalysisResponse> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured. Please set VITE_OPENROUTER_API_KEY in your .env file.');
  }

  const prompt = request.prompt || 
    "You are an AI assistant helping a blind person understand their surroundings. " +
    "Describe this image in clear, detailed terms. Focus on: " +
    "1. Main objects and their locations (left, right, center, near, far) " +
    "2. Text if any is visible " +
    "3. Colors and important visual details " +
    "4. Any potential hazards or important information " +
    "Keep the description concise but informative, as it will be read aloud.";

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'EyeConnect',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini', // GPT-4o-mini: supports vision, much cheaper, reliable
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${request.imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('OpenRouter API error:', response.status, errorData);
      
      // Extract detailed error message from OpenRouter response
      const errorMessage = errorData?.error?.message || errorData?.message || response.statusText;
      
      if (response.status === 401) {
        throw new Error('Invalid OpenRouter API key. Please check your configuration.');
      } else if (response.status === 404) {
        throw new Error(`Model not found. The model may not be available or doesn't support vision. Error: ${errorMessage}`);
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else {
        throw new Error(`OpenRouter API error (${response.status}): ${errorMessage}`);
      }
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from AI model');
    }

    const description = data.choices[0].message.content;

    return {
      description,
      confidence: 0.9, // OpenRouter doesn't provide confidence scores
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to analyze image. Please try again.');
  }
}

/**
 * Convert a canvas to base64 image
 */
export function canvasToBase64(canvas: HTMLCanvasElement, quality: number = 0.8): string {
  return canvas.toDataURL('image/jpeg', quality).split(',')[1];
}

/**
 * Check if OpenRouter API is configured
 */
export function isOpenRouterConfigured(): boolean {
  return !!OPENROUTER_API_KEY && OPENROUTER_API_KEY !== 'your-openrouter-api-key-here';
}

