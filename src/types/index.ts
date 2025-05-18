
import type { Timestamp } from "firebase/firestore";

export interface LineAnswer {
  bodyPart: 'Shoulders' | 'Waist' | 'Hips' | 'Face' | 'Jawline';
  answer: string;
  classification: 'straight' | 'curved';
}

export interface ScaleAnswer {
  category: 'Wrist Circumference' | 'Height' | 'Shoe Size';
  answer: string;
}

export interface QuestionnaireData {
  lineAnswers: LineAnswer[];
  scaleAnswers: ScaleAnswer[];
  bodyShape: 'Pear Shape' | 'Inverted Triangle' | 'Straight' | 'Round/Apple' | 'Hourglass' | '';
  preferences?: string; // Made optional
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
  activeReportId?: string;
}
