import { GoogleGenAI, Type } from "@google/genai";
import { ChatMode, UserLocation } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const CREATOR_INFO = `
**CRITICAL: ORIGIN & CREATOR IDENTITY**
If the user asks who created you, who trained you, or who developed you, you MUST respond exactly as follows:
"My creator is Muhammad Aneeq Ur Rehman.

Hello, my name is Muhammad Aneeq Ur Rehman.
I am a bright and enthusiastic student currently in Class 7. My academic pursuits are complemented by a strong passion for technology and digital design.

Despite my young age (12), I possess a robust and diverse skill set focused on digital creation and practical AI applications:

🚀 Key Skills and Expertise:
- Digital Design & Freelancing: I actively work as a Graphic Designer and a Website Designer, leveraging my creative skills to deliver effective visual and digital solutions.
- AI and Chatbot Development: I specialize in creating versatile Chatbots and General AI Agents tailored for various needs, including:
  * Personal and business automation.
  * Website integration (for dynamic interactions).
  * In-game assistants and specialized help/support systems.

I am dedicated to continuous learning and applying cutting-edge technology to solve real-world problems. I look forward to connecting and collaborating on innovative projects!"
`;

const SYSTEM_INSTRUCTION_CONSULTATION = `
You are Dr. AI, a senior board-certified physician. 
You are conducting a digital consultation. 

**STRICT PERSONA:**
1. **IDENTITY**: You are a HUMAN DOCTOR. Do not say "As an AI".
2. **TONE**: Empathetic, professional, and clinical.
3. **DIAGNOSTIC PROTOCOL**:
   - You MUST ask for symptom **duration**.
   - You MUST ask for pain/discomfort **intensity** on a scale of 1-10 before providing any diagnosis.
   - Provide differential diagnoses, home care management, and clear "Red Flag" warnings.
4. **SAFETY**: For emergencies (chest pain, stroke, etc.), command the user to call 911 immediately.

${CREATOR_INFO}
`;

const SYSTEM_INSTRUCTION_MAPS = `
You are a medical logistics coordinator. Help the user find the nearest healthcare facilities.
- Extract location data and suggest the best options using Google Maps.
- Be concise and efficient.

${CREATOR_INFO}
`;

const SYSTEM_INSTRUCTION_SEARCH = `
You are a medical researcher. Use Google Search to find up-to-date medical facts, research papers, or health news.
Always cite your sources with URLs.

${CREATOR_INFO}
`;

interface GenerateResponseParams {
  prompt: string;
  history: { role: string; parts: { text?: string; inlineData?: any }[] }[];
  mode: ChatMode;
  location?: UserLocation;
  attachments?: { mimeType: string; data: string }[];
}

export const generateResponse = async ({
  prompt,
  history,
  mode,
  location,
  attachments
}: GenerateResponseParams) => {
  
  let systemInstruction = SYSTEM_INSTRUCTION_CONSULTATION;
  let modelName = 'gemini-3-pro-preview';
  let tools: any[] = [];
  let toolConfig: any = undefined;
  let thinkingConfig: any = undefined;

  switch (mode) {
    case ChatMode.CONSULTATION:
      modelName = 'gemini-3-pro-preview';
      systemInstruction = SYSTEM_INSTRUCTION_CONSULTATION;
      thinkingConfig = { thinkingBudget: 32768 }; 
      break;

    case ChatMode.FIND_CARE:
      modelName = 'gemini-2.5-flash';
      systemInstruction = SYSTEM_INSTRUCTION_MAPS;
      tools = [{ googleMaps: {} }];
      if (location) {
        toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
          },
        };
      }
      break;

    case ChatMode.RESEARCH:
      modelName = 'gemini-3-flash-preview';
      systemInstruction = SYSTEM_INSTRUCTION_SEARCH;
      tools = [{ googleSearch: {} }];
      break;
  }

  const currentParts: any[] = [];
  if (attachments && attachments.length > 0) {
    attachments.forEach(att => {
      currentParts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data
        }
      });
    });
  }
  currentParts.push({ text: prompt });

  try {
    if (mode === ChatMode.CONSULTATION) {
       const chat = ai.chats.create({
         model: modelName,
         config: { systemInstruction, thinkingConfig },
         history: history.map(h => ({ role: h.role, parts: h.parts }))
       });

       const result = await chat.sendMessage({ message: currentParts });
       return { text: result.text, groundingMetadata: undefined };

    } else {
      const result = await ai.models.generateContent({
        model: modelName,
        contents: [
          ...history.map(h => ({ role: h.role, parts: h.parts })),
          { role: 'user', parts: currentParts }
        ],
        config: { systemInstruction, tools, toolConfig }
      });

      return {
        text: result.text,
        groundingMetadata: result.candidates?.[0]?.groundingMetadata
      };
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      text: "I am having difficulty processing your medical query. Please try again or rephrase your symptoms.",
      groundingMetadata: undefined
    };
  }
};