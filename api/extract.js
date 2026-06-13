export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const key = process.env.ANTHROPIC_API_KEY || process.env.REACT_APP_ANTHROPIC_KEY;
  if (!key) {
    res.status(500).json({ error: "Anthropic API key not configured on server" });
    return;
  }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const kind = body.kind, media_type = body.media_type, data = body.data, prompt = body.prompt;
    if (!data || !media_type) {
      res.status(400).json({ error: "Missing file data" });
      return;
    }
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: [
            { type: kind === "image" ? "image" : "document", source: { type: "base64", media_type: media_type, data: data } },
            { type: "text", text: prompt || "" }
          ]
        }]
      })
    });
    const text = await r.text();
    res.setHeader("Content-Type", "application/json");
    res.status(r.status).send(text);
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
}
