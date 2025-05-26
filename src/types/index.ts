
// No longer using Firebase Timestamps directly for these transient types
// import type { Timestamp } from "firebase/firestore";

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
  // preferences removed as per previous request
}

export interface UserReportData { // Renamed to avoid confusion with User-specific reports
  recommendations: string;
  questionnaireData: QuestionnaireData;
  recipientEmail?: string; // Email for sending the report
  generatedAtClient?: string; // Client-side timestamp for display, since no server timestamp is stored
}

// UserMeta and UserReport (Firestore specific) are no longer needed
