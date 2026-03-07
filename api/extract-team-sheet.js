import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import OpenAI from "openai";

console.log("KEY LOADED:", !!process.env.OPENAI_API_KEY);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {

    const { image } = req.body || {};

    if (!image) {
      return res.status(400).json({
        error: "OCR failed",
        detail: "No image was sent to the API"
      });
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Extract the football players and positions from this team sheet.

Return strict JSON in this format:

{
  "players": [
    { "name": "Player Name", "pos": "Position" }
  ]
}

Rules:
- Ignore coaches
- Ignore "confirmed"
- Ignore side notes unless clearly a player
- Ignore age labels like U13
- Keep full player names
- Use positions like GK, CB, RB, LB, CM, CDM, CAM, RW, LW, CF, ST
- Return JSON only`
            },
            {
              type: "input_image",
              image_url: image
            }
          ]
        }
      ]
    });

    return res.status(200).json({
      result: response.output_text || ""
    });

  } catch (error) {

    console.error("extract-team-sheet error:", error);

    return res.status(500).json({
      error: "OCR failed",
      detail: error?.message || "Unknown server error"
    });

  }

}