// OpenRouter AI Vision Service
// Communicates with serverless endpoint that proxies requests to OpenRouter

const ANALYZE_ENDPOINT = "/api/analyze-image";
const STATUS_ENDPOINT = "/api/openrouter-status";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEV_API_KEY = import.meta.env.DEV
  ? import.meta.env.VITE_OPENROUTER_API_KEY
  : undefined;
let cachedStatus: boolean | null = null;

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
  let serverlessError: unknown = null;

  try {
    return await callServerlessAnalyzer(request);
  } catch (error) {
    serverlessError = error;
    console.warn("Serverless analyzer unavailable, attempting direct OpenRouter call.", error);
  }

  if (import.meta.env.DEV && DEV_API_KEY) {
    return await callOpenRouterDirect(request);
  }

  if (serverlessError instanceof Error) {
    throw serverlessError;
  }

  throw new Error("Failed to analyze image. Please try again.");
}

/**
 * Convert a canvas to base64 image
 */
export function canvasToBase64(canvas: HTMLCanvasElement, quality: number = 0.8): string {
  return canvas.toDataURL('image/jpeg', quality).split(',')[1];
}

/**
 * Check if OpenRouter API is configured by asking the serverless status endpoint
 */
export async function isOpenRouterConfigured(forceRefresh: boolean = false): Promise<boolean> {
  if (!forceRefresh && cachedStatus !== null) {
    return cachedStatus;
  }

  try {
    const response = await fetch(STATUS_ENDPOINT, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-store',
      },
    });

    if (!response.ok) {
      // Fallback to dev key if serverless status endpoint isn't available locally
      if (import.meta.env.DEV && DEV_API_KEY) {
        cachedStatus = true;
        return true;
      }

      cachedStatus = false;
      return false;
    }

    const data = await response.json();
    cachedStatus = !!data?.configured;
    return cachedStatus;
  } catch (error) {
    console.error('Failed to check OpenRouter status:', error);

    if (import.meta.env.DEV && DEV_API_KEY) {
      cachedStatus = true;
      return true;
    }

    cachedStatus = false;
    return false;
  }
}

async function callServerlessAnalyzer(request: VisionAnalysisRequest): Promise<VisionAnalysisResponse> {
  const response = await fetch(ANALYZE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageBase64: request.imageBase64,
      prompt: request.prompt,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data) {
    const errorMessage = data?.error || response.statusText || 'Failed to analyze image';
    throw new Error(
      typeof errorMessage === 'string'
        ? errorMessage
        : 'OpenRouter API error. Please try again.'
    );
  }

  const description = data.description;

  return {
    description: typeof description === 'string' ? description : 'AI response unavailable.',
    confidence: data.confidence ?? 0.9,
  };
}

async function callOpenRouterDirect(request: VisionAnalysisRequest): Promise<VisionAnalysisResponse> {
  if (!DEV_API_KEY) {
    throw new Error('OpenRouter API key not configured for development.');
  }

  const prompt = request.prompt || 
    "You are an AI assistant helping a blind person understand their surroundings. " +
    "Describe this image in clear, detailed terms. Focus on: " +
    "1. Main objects and their locations (left, right, center, near, far) " +
    "2. Text if any is visible " +
    "3. Colors and important visual details " +
    "4. Any potential hazards or important information " +
    "Keep the description concise but informative, as it will be read aloud.";

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEV_API_KEY}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'EyeConnect (Local Dev)',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
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

  const data = await response.json().catch(() => null);

  if (!response.ok || !data) {
    console.error('Direct OpenRouter API error:', response.status, data);
    const errorMessage = data?.error || response.statusText || 'Failed to analyze image';
    throw new Error(
      typeof errorMessage === 'string'
        ? errorMessage
        : 'OpenRouter API error. Please try again.'
    );
  }

  const description = normalizeDescription(data?.choices?.[0]?.message?.content);

  if (!description) {
    throw new Error('No response from AI model');
  }

  return {
    description,
    confidence: 0.9,
  };
}

function normalizeDescription(content: unknown): string {
  if (!content) {
    return '';
  }

  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') {
          return part;
        }

        if (part && typeof part === 'object' && 'text' in part && typeof (part as any).text === 'string') {
          return (part as any).text;
        }

        if (part && typeof part === 'object' && 'content' in part && typeof (part as any).content === 'string') {
          return (part as any).content;
        }

        return '';
      })
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  if (typeof content === 'object' && 'text' in (content as any) && typeof (content as any).text === 'string') {
    return (content as any).text.trim();
  }

  return '';
}

