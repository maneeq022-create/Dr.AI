import { GoogleGenAI, Type, ThinkingLevel, Modality } from "@google/genai";
import { ChatMode, UserLocation } from "../types";
import { SYSTEM_INSTRUCTION_CONSULTATION as BASE_INSTRUCTION, SYSTEM_INSTRUCTION_VET } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// CREATOR_INFO
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
${BASE_INSTRUCTION}

${CREATOR_INFO}
`;

// ... existing system instructions ...

export interface GenAIResponse {
  text: string;
  groundingMetadata?: any;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
}

/**
 * High-quality Text-to-Speech using Gemini 3.1 Flash TTS
 */
export const generateTTS = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Professional clinical voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return `data:audio/wav;base64,${base64Audio}`;
    }
    return null;
  } catch (err) {
    console.error("TTS Error:", err);
    return null;
  }
};

/**
 * Image Generation using gemini-3-pro-image-preview
 */
export const generateMedicalImaging = async (prompt: string, aspectRatio: string = "1:1", imageSize: string = "1K") => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: imageSize as any
        }
      }
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (imagePart?.inlineData) {
      return `data:image/png;base64,${imagePart.inlineData.data}`;
    }
    return null;
  } catch (err) {
    console.error("Image Gen Error:", err);
    return null;
  }
};

/**
 * Video Generation for specialized anatomy/procedure visualizations
 */
export const generateMedicalVideo = async (prompt: string) => {
  try {
    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: '16:9'
      }
    });

    // Note: In a real app, you'd poll for 'operation.done'. 
    // Here we return the operation handle if not done, or data if available.
    return operation;
  } catch (err) {
    console.error("Video Gen Error:", err);
    return null;
  }
};

// ... existing generateResponse implementation ...

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
  let modelName = 'gemini-3.1-pro-preview';
  let tools: any[] = [];
  let toolConfig: any = undefined;
  let thinkingConfig: any = undefined;

  switch (mode) {
    case ChatMode.CONSULTATION:
      modelName = 'gemini-3.1-pro-preview';
      systemInstruction = SYSTEM_INSTRUCTION_CONSULTATION;
      thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH }; 
      break;

    case ChatMode.VET:
      modelName = 'gemini-3.1-pro-preview';
      systemInstruction = SYSTEM_INSTRUCTION_VET;
      thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      break;

    case ChatMode.PEDIATRIC:
      modelName = 'gemini-3.1-pro-preview';
      systemInstruction = "You are Dr. AI (Pediatrician). Focus on child-specific physiology, developmental milestones, and pediatric dosages. Use a gentle, reassuring tone for parents.";
      break;

    case ChatMode.ELDERLY:
      modelName = 'gemini-3.1-pro-preview';
      systemInstruction = "You are Dr. AI (Geriatrician). Focus on elderly care, common geriatric conditions, medication interactions, and safety at home. Use simple, clear language and avoid complex medical jargon.";
      break;

    case ChatMode.PREGNANCY:
      modelName = 'gemini-3.1-pro-preview';
      systemInstruction = "You are Dr. AI (OB-GYN). Provide week-by-week fetal development tracking, prenatal health advice, and safe medication guidelines for pregnancy.";
      break;

    case ChatMode.FIND_CARE:
      modelName = 'gemini-3-flash-preview';
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