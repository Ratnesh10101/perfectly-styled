import type { Timestamp } from "firebase/firestore";

export interface QuestionnaireData {
  dominantLine: string;
  bodyShape: string;
  scale: string;
  preferences: string;
  userId?: string;
  createdAt?: Timestamp;
}

export interface UserReport {
  recommendations: string;
  questionnaireData: QuestionnaireData;
  generatedAt?: Timestamp;
  userId?: string;
}

export interface UserMeta {
  hasPaid: boolean;
  hasGeneratedReport: boolean;
  email?: string | null;
  questionnaireComplete?: boolean;
}
