// pages/api/gpt.ts
import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure this is set in .env.local
});

type LangCode = "english" | "hindi" | "telugu";

type GPTResponse = {
  [key in LangCode]?: string;
};

type RequestBody = {
  question: string;
  languages: LangCode[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { question, languages } = req.body as RequestBody;

  if (!question || !Array.isArray(languages) || languages.length === 0) {
    return res.status(400).json({ error: "Invalid request. Provide question and at least one language." });
  }

  const systemPrompt = `
You are a compassionate spiritual guide based on the Bhagavad Gita. For each user question, return a JSON response that includes:
- A Bhagavad Gita verse (include chapter and verse number).
- A brief explanation in each requested language.

Output JSON only. Return keys matching only these possible language values: "english", "hindi", "telugu".
Do NOT include extra commentary or non-JSON text.

Example:
{
  "english": "...",
  "hindi": "...",
  "telugu": "..."
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4", // or "gpt-3.5-turbo" if needed
      messages: [
        { role: "system", content: systemPrompt.trim() },
        {
          role: "user",
          content: `Question: ${question}\nLanguages requested: ${languages.join(", ")}`,
        },
      ],
      temperature: 0.8,
    });

    const raw = completion.choices[0].message?.content?.trim() || "{}";

    let parsed: GPTResponse = {};
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      return res.status(500).json({
        error: "Failed to parse GPT response. Expected valid JSON.",
        raw,
      });
    }

    return res.status(200).json({ responses: parsed });
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
}
