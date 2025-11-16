const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_PROMPT =
  "You are an AI assistant helping a blind person understand their surroundings. " +
  "Describe the image in clear, detailed terms. Focus on: " +
  "1. Main objects and their locations (left, right, center, near, far) " +
  "2. Any visible text " +
  "3. Colors and important visual details " +
  "4. Potential hazards or important cues " +
  "Keep the response concise but informative (2-3 sentences).";

const MODEL_ID =
  process.env.OPENROUTER_MODEL ||
  process.env.VITE_OPENROUTER_MODEL ||
  "openai/gpt-4o-mini";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey =
    process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error:
        "OpenRouter API key not configured. Set OPENROUTER_API_KEY in your environment variables.",
    });
  }

  const body =
    typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body;
  const { imageBase64, prompt } = body || {};

  if (!imageBase64 || typeof imageBase64 !== "string") {
    return res
      .status(400)
      .json({ error: "imageBase64 is required for analysis." });
  }

  const promptText = prompt || DEFAULT_PROMPT;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:5173",
        "X-Title": "EyeConnect",
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: promptText,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
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
      console.error("OpenRouter API error:", response.status, data);
      const errorMessage =
        data?.error?.message || data?.message || response.statusText;
      return res.status(response.status).json({
        error: errorMessage || "OpenRouter API error",
      });
    }

    const description = extractDescription(data);

    if (!description) {
      return res.status(502).json({
        error: "AI model returned an empty response. Please try again.",
      });
    }

    return res.status(200).json({
      description,
      confidence: 0.9,
    });
  } catch (error) {
    console.error("Error analyzing image:", error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to analyze image. Please try again.",
    });
  }
}

function extractDescription(data: any): string {
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    return "";
  }

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (typeof part?.text === "string") {
          return part.text;
        }

        if (typeof part?.content === "string") {
          return part.content;
        }

        return "";
      })
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  if (typeof content === "object" && typeof content?.text === "string") {
    return content.text.trim();
  }

  return "";
}