import { ChatMode } from "./types";
import { Stethoscope, MapPin, Search, Dog, Baby, UserPlus, HeartPulse, ShieldAlert } from "lucide-react";

export const CHAT_MODES = [
  {
    id: ChatMode.CONSULTATION,
    label: "Medical Consultation",
    description: "AI Diagnostic Reasoning",
    icon: Stethoscope,
    color: "text-blue-600",
    bg: "bg-blue-100",
    border: "border-blue-200"
  },
  {
    id: ChatMode.VET,
    label: "Veterinary Mode",
    description: "Animal doctor & pet care",
    icon: Dog,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200"
  },
  {
    id: ChatMode.PEDIATRIC,
    label: "Pediatric Care",
    description: "Child-specific dosages & advice",
    icon: Baby,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200"
  },
  {
    id: ChatMode.ELDERLY,
    label: "Elderly Care",
    description: "High contrast & simplified UI",
    icon: UserPlus,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200"
  },
  {
    id: ChatMode.PREGNANCY,
    label: "Pregnancy Track",
    description: "Weekly fetal development logs",
    icon: HeartPulse,
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-200"
  },
  {
    id: ChatMode.FIND_CARE,
    label: "Find Nearby Care",
    description: "Clinics, Doctors & Pharmacies",
    icon: MapPin,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    border: "border-emerald-200"
  },
  {
    id: ChatMode.RESEARCH,
    label: "Medical Research",
    description: "Latest medical journals & news",
    icon: Search,
    color: "text-violet-600",
    bg: "bg-violet-100",
    border: "border-violet-200"
  }
];

export const SYSTEM_INSTRUCTION_CONSULTATION = `
You are Dr. AI, a professional medical consultant.
- **Symptom Intensity**: You MUST proactively ask the user to rate their symptom intensity on a scale of 1-10 if they haven't provided it. 
- **Form Integration**: If a user mentions a physical problem or symptom, you MUST generate a structured 'Patient Information Form' request. 
- Ask for Name, Age, Symptoms, Duration, and Medication history.
- **Contextual Summary**: Once info is provided, give a structured analysis.
- **Emergency Detection**: If you detect life-threatening symptoms (chest pain, stroke, severe bleeding), immediately prefix your message with [EMERGENCY] and advise calling 911/112.
- Use medical jargon where appropriate but always explain in simple terms.
- **ELIs-5 Mode**: If the user asks to simplify, use analogies for a 5-year-old.
`;

export const SYSTEM_INSTRUCTION_VET = `
You are Dr. AI (Veterinary Expert). 
- You specialize in pets (dogs, cats, birds, reptiles).
- Always ask for the Species and Breed.
- Provide advice on nutrition, symptoms, and dosages specifically for animals.
- Warn that animal biology is different from humans.
`;

export const EMERGENCY_KEYWORDS = ["chest pain", "stroke", "difficulty breathing", "severe bleeding", "unconscious", "poisoning", "heart attack"];

export const DISCLAIMER_TEXT = `
I am an AI assistant, not a human doctor. 
My responses are for informational purposes only and should not replace professional medical advice, diagnosis, or treatment. 
If you are experiencing a medical emergency, please call emergency services immediately.
`;

export const CARE_CHIPS = [
  "Cardiologist",
  "Dermatologist",
  "Dentist",
  "Urgent Care",
  "Pharmacy",
  "Pediatrician",
  "Orthopedic",
  "Gastroenterologist",
  "Psychiatrist",
  "Pathology Lab",
  "General Physician",
  "Eye Specialist",
  "Blood Bank",
  "ENT Specialist"
];
