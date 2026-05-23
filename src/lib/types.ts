export type Subject =
  | "Math"
  | "Physics"
  | "Chemistry"
  | "CS"
  | "History"
  | "Biology"
  | "English"
  | "Economics";

export interface Note {
  id: string;
  title: string;
  content: string;
  subject: Subject;
  folderId: string | null;
  tags: string[];
  pinned: boolean;
  archived: boolean;
  trashed: boolean;
  coverColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  mastery: number; // 0-100
  dueAt: string;
  easeFactor: number;
  interval: number;
}

export interface FlashcardDeck {
  id: string;
  name: string;
  subject: Subject;
  description: string;
  gradient: string;
  cards: Flashcard[];
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  subject: Subject;
  description: string;
  questions: QuizQuestion[];
  bestScore?: number;
  attempts: number;
  timePerQuestion: number;
  createdAt: string;
}

export type AssignmentStatus = "todo" | "in-progress" | "review" | "done";
export type Priority = "low" | "medium" | "high";

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subject: Subject;
  status: AssignmentStatus;
  priority: Priority;
  dueDate: string;
  progress: number;
  createdAt: string;
}

export interface Exam {
  id: string;
  subject: Subject;
  title: string;
  date: string;
  topics: string[];
  prepProgress: number;
  notes?: string;
}

export type EventType = "exam" | "assignment" | "study";

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  date: string;
  subject?: Subject;
}

export interface PomodoroSession {
  id: string;
  duration: number;
  type: "focus" | "short-break" | "long-break";
  task?: string;
  completedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface User {
  name: string;
  email: string;
  avatar?: string;
}
