import { ChatMode } from "./types";
import { Stethoscope, MapPin, Search } from "lucide-react";

export const CHAT_MODES = [
  {
    id: ChatMode.CONSULTATION,
    label: "Medical Consultation",
    description: "Deep reasoning for diagnosis & advice",
    icon: Stethoscope,
    color: "text-blue-600",
    bg: "bg-blue-100",
    border: "border-blue-200"
  },
  {
    id: ChatMode.FIND_CARE,
    label: "Find Nearby Care",
    description: "Locate doctors, clinics & pharmacies",
    icon: MapPin,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    border: "border-emerald-200"
  },
  {
    id: ChatMode.RESEARCH,
    label: "Medical Research",
    description: "Search latest medical news & data",
    icon: Search,
    color: "text-violet-600",
    bg: "bg-violet-100",
    border: "border-violet-200"
  }
];

export const DISCLAIMER_TEXT = `
I am an AI assistant, not a human doctor. 
My responses are for informational purposes only and should not replace professional medical advice, diagnosis, or treatment. 
If you are experiencing a medical emergency, please call emergency services immediately.
`;