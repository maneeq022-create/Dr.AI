export interface AuthUser {
  uid: string;
  name: string;
  email: string;
  photo?: string;
  subscriptionStatus?: 'free' | 'trial' | 'premium';
  trialEndsAt?: Date | null;
}

export enum ChatMode {
  CONSULTATION = 'CONSULTATION', // gemini-3.1-pro-preview (Thinking)
  VET = 'VET',                   // Specialized Veterinary Mode
  PEDIATRIC = 'PEDIATRIC',       // Child-specific health
  ELDERLY = 'ELDERLY',           // High contrast/simplified
  PREGNANCY = 'PREGNANCY',       // Fetal tracking
  FIND_CARE = 'FIND_CARE',       // gemini-3-flash-preview (Maps)
  RESEARCH = 'RESEARCH'          // gemini-3-flash-preview (Search)
}

export interface Attachment {
  type: 'image' | 'video' | 'pdf';
  url: string;      // Blob URL for local preview
  data: string;     // Base64 string for API
  mimeType: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  mode: ChatMode;
  isThinking?: boolean; // For UI state while streaming thinking
  groundingMetadata?: GroundingMetadata;
  attachments?: Attachment[];
  audio?: string; // base64 audio response for TTS
}

export interface HealthVitals {
  bmi?: number;
  bmr?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  hydration?: number; // glasses or ml
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string; // e.g., "After meal"
  startDate: Date;
  reminders: string[]; // ['08:00', '20:00']
}
export interface GroundingMetadata {
  searchChunks?: {
    uri: string;
    title: string;
  }[];
  mapChunks?: {
    source: {
        uri: string;
    };
    placeId: string;
    title: string;
  }[];
}

export interface UserLocation {
  latitude: number;
  longitude: number;
}