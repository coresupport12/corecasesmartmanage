
import { GoogleGenAI } from "@google/genai";
import { CaseCategory } from "../types";

export const polishMessage = async (text: string, category: CaseCategory, isWhiteLabel: boolean): Promise<string> => {
  // @google/genai 가이드라인 준수: named parameter로 apiKey 전달
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const systemInstruction = `
    Role: Expert Dental Lab Secretary at Core Dental Studio.
    Task: Translate and Rewrite input into ONE professional Business English paragraph for a Dentist.
    Context: "${category}". 
    ${isWhiteLabel ? "Note: This is for a B2B partner lab to forward to their client." : "Note: This is a direct message to our client doctor."}
    Rules:
    1. Translate Korean to formal Business English if needed.
    2. Maintain a respectful, helpful, and technical tone.
    3. Output ONLY the polished message body. 
    4. Do not include greetings (Dear Dr.) or sign-offs.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${systemInstruction}\n\nInput: "${text}"\nOutput:`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });

    // @google/genai 가이드라인 준수: response.text는 프로퍼티임 (메소드 호출 아님)
    return response.text || text;
  } catch (error) {
    console.error("Gemini Polishing Error:", error);
    return text;
  }
};
