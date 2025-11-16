export default function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey =
    process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;

  const configured =
    typeof apiKey === "string" &&
    apiKey.trim().length > 0 &&
    apiKey !== "your-openrouter-api-key-here";

  return res.status(200).json({ configured });
}

