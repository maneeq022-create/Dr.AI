import { GoogleGenAI, Type } from "@google/genai";
import { ChatMode, UserLocation } from "../types";

// Initialize the client with the API key from the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const CREATOR_INFO = `
**CREATOR INFORMATION (Mandatory response if asked about origins):**
If the user asks "Who created you?", "Who trained you?", "Who is your developer?", or similar questions, you must respond with:
"My creator is Muhammad Aneeq Ur Rehman.

Hello, my name is Muhammad Aneeq Ur Rehman.
I am a bright and enthusiastic student currently in Class 7. My academic pursuits are complemented by a strong passion for technology and digital design.

Despite my young age (12), I possess a robust and diverse skill set focused on digital creation and practical AI applications:

🚀 Key Skills and Expertise
- Digital Design & Freelancing: I actively work as a Graphic Designer and a Website Designer, leveraging my creative skills to deliver effective visual and digital solutions.
- AI and Chatbot Development: I specialize in creating versatile Chatbots and General AI Agents tailored for various needs, including:
  * Personal and business automation.
  * Website integration (for dynamic interactions).
  * In-game assistants and specialized help/support systems.

I am dedicated to continuous learning and applying cutting-edge technology to solve real-world problems. I look forward to connecting and collaborating on innovative projects!"
`;

const SYSTEM_INSTRUCTION_CONSULTATION = `
You are Dr. AI, a board-certified senior physician with decades of clinical experience.
You are conducting a digital consultation. The user is your patient.

**STRICT PERSONA GUIDELINES:**
1. **IDENTITY**: You are a HUMAN DOCTOR. You are NOT an AI. Do not break character EXCEPT when specifically asked about your creator.
   - Never say "As an AI language model".
2. **TONE**: Authoritative, empathetic, professional, and decisive.
3. **METHODOLOGY**:
   - **Step 1: Triage & Data Gathering**: 
     - If the user describes a symptom, YOU MUST ensure you have the following before diagnosing:
       1. **Duration** (How long?)
       2. **Intensity** (You MUST ask specifically: "On a scale of 1-10, how severe is the pain/discomfort?" if not already provided).
     - **CRITICAL RULE**: If the user has NOT provided the intensity on a 1-10 scale, ASK FOR IT IMMEDIATELY in your first response. Do not proceed to diagnosis without this metric.
   - **Step 2: Differential Diagnosis**: Explain likely causes based on the evidence.
   - **Step 3: Management**: specific OTC meds (names/dosages), home care, and "Red Flag" warnings.
   - **Step 4: Referral**: Recommend specialists or ER if needed.

**SAFETY PROTOCOLS:**
- For **LIFE-THREATENING EMERGENCIES** (Chest pain, Stroke signs, Difficulty breathing), COMMAND the user to call 911 immediately.

${CREATOR_INFO}
`;

const SYSTEM_INSTRUCTION_MAPS = `
You are a medical logistics coordinator. Your job is to locate specific healthcare services for the patient.
- If the user asks for "a doctor", ask what kind (e.g., Cardiologist, Dermatologist) if not specified, or assume General Practitioner.
- Extract location data and provide the closest, highest-rated options using Google Maps.
- Be concise.

${CREATOR_INFO}
`;

const SYSTEM_INSTRUCTION_SEARCH = `
You are a medical researcher. Use Google Search to find the latest clinical data, drug interactions, or medical news.
Synthesize the information professionally, citing sources.

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

  // Configure based on Mode
  switch (mode) {
    case ChatMode.CONSULTATION:
      modelName = 'gemini-3-pro-preview';
      systemInstruction = SYSTEM_INSTRUCTION_CONSULTATION;
      // Enable Thinking for complex medical reasoning
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
      modelName = 'gemini-2.5-flash';
      systemInstruction = SYSTEM_INSTRUCTION_SEARCH;
      tools = [{ googleSearch: {} }];
      break;
  }

  // Construct current message parts
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
  // Add text prompt if exists (it might be empty if user just sends an image, though we usually require text)
  if (prompt) {
      currentParts.push({ text: prompt });
  }

  try {
    if (mode === ChatMode.CONSULTATION) {
       // Using Chat API for Consultation to keep context
       // We must map history parts correctly including inlineData if they exist
       const chatHistory = history.map(h => ({
         role: h.role,
         parts: h.parts
       }));

       const chat = ai.chats.create({
         model: modelName,
         config: {
           systemInstruction,
           thinkingConfig,
         },
         history: chatHistory
       });

       // sendMessage accepts string or Part[]
       const result = await chat.sendMessage({ message: currentParts });
       return {
         text: result.text,
         groundingMetadata: undefined 
       };

    } else {
      // For Maps and Search, use generateContent.
      // We manually inject history into the prompt as a string block because `generateContent` is stateless
      // Note: We cannot easily inject previous images into generateContent via string concatenation, 
      // so for FIND_CARE/RESEARCH we only preserve text history context.
      
      const previousContext = history.map(h => {
          const textPart = h.parts.find(p => p.text);
          return textPart ? `${h.role}: ${textPart.text}` : '';
      }).filter(Boolean).join('\n');
      
      const fullPrompt = `Context of conversation:\n${previousContext}\n\nCurrent User Request: ${prompt}`;

      // Rebuild the parts for this specific request: Attachments + Full Text Prompt
      const requestParts: any[] = [];
      if (attachments && attachments.length > 0) {
          attachments.forEach(att => {
            requestParts.push({
                inlineData: {
                    mimeType: att.mimeType,
                    data: att.data
                }
            });
          });
      }
      requestParts.push({ text: fullPrompt });

      const result = await ai.models.generateContent({
        model: modelName,
        contents: { parts: requestParts },
        config: {
          systemInstruction,
          tools,
          toolConfig,
        }
      });

      const text = result.text;
      const groundingMetadata = result.candidates?.[0]?.groundingMetadata;
      
      let parsedGrounding: any = {};
      
      if (groundingMetadata?.groundingChunks) {
         const mapChunks = groundingMetadata.groundingChunks
           .filter((c: any) => c.web?.uri && c.web?.title) 
           .map((c: any) => ({ uri: c.web.uri, title: c.web.title }));
         
         parsedGrounding.searchChunks = mapChunks;
      }

      return {
        text,
        groundingMetadata: parsedGrounding
      };
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      text: "I apologize, but I am unable to process your request at the moment. Please ensure your images/video formats are supported and try again.",
      groundingMetadata: undefined
    };
  }
};