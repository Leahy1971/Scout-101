console.log("KEY LOADED:", !!process.env.OPENAI_API_KEY);

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

    const { image } = req.body;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Extract the football players and positions from this team sheet. Return JSON: players:[{name,pos}]"
            },
            {
              type: "input_image",
              image_url: image
            }
          ]
        }
      ]
    });

    res.status(200).json({
      result: response.output_text
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "OCR failed" });
  }
}