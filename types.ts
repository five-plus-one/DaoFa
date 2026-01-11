
export type Proficiency = 0 | 1 | 2 | 3 | 4 | 5;

export interface Question {
  id: string;
  chapter: string;
  title: string;
  content: string;
  proficiency: Proficiency;
  attempts: number;
}

export interface StudyState {
  questions: Question[];
  currentIndex: number;
  sessionQueue: string[]; // IDs of questions in current session
  isFinished: boolean;
}
