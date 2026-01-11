
export type Proficiency = 0 | 1 | 2 | 3 | 4 | 5;

export interface Question {
  id: string;
  chapter: string;
  title: string;
  mnemonic: string;      // 简略版：记忆口诀与核心要点
  fullContent: string;   // 详细版：完整未简化的内容
  proficiency: Proficiency;
  attempts: number;
}

export interface StudyState {
  questions: Question[];
  currentIndex: number;
  sessionQueue: string[];
  isFinished: boolean;
}
