//Test

import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type LangCode = "english" | "hindi" | "telugu";

type RequestBody = {
  question: string;
  languages: LangCode[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { question, languages } = req.body as RequestBody;

  if (!question || !Array.isArray(languages) || languages.length === 0) {
    return res.status(400).json({ error: "Missing question or languages." });
  }

  const systemPrompt = `
You are a compassionate spiritual guide.
Respond with Bhagavad Gita verses and brief explanations in these languages: ${languages.join(", ")}.
Use this format:

{
  "english": "...",
  "hindi": "...",
  "telugu": "..."
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Question: ${question}`,
        },
      ],
    });

    const raw = completion.choices[0].message?.content ?? "{}";

    const response = JSON.parse(raw);
    return res.status(200).json({ responses: response });
  } catch (err: any) {
    console.error("GPT error:", err);
    return res.status(500).json({ error: "GPT failed", detail: err.message });
  }
}
