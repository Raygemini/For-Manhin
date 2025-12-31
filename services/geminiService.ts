
import { GoogleGenAI, Type } from "@google/genai";
import { WordInfo } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function fetchWordDetails(word: string): Promise<WordInfo> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `請針對小學一年級的小朋友，解釋漢字「${word}」。包含拼音、簡單意思、以及一個充滿童趣的例句。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            pinyin: { type: Type.STRING },
            meaning: { type: Type.STRING },
            exampleSentence: { type: Type.STRING },
          },
          required: ["word", "pinyin", "meaning", "exampleSentence"],
        },
      },
    });

    const result = JSON.parse(response.text);
    return result;
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback info
    return {
      word,
      pinyin: "載入中...",
      meaning: "這是一個很有趣的中文字！",
      exampleSentence: `我們一起來寫「${word}」吧！`
    };
  }
}
