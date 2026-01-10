export enum ChatMode {
  CONSULTATION = 'CONSULTATION', // gemini-3-pro-preview (Thinking)
  FIND_CARE = 'FIND_CARE',       // gemini-2.5-flash (Maps)
  RESEARCH = 'RESEARCH'          // gemini-2.5-flash (Search)
}

export interface Attachment {
  type: 'image' | 'video';
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