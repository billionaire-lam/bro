export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'explanation'
  | 'example'
  | 'formula'
  | 'tip'
  | 'image'
  | 'video'
  | 'slide'
  | 'quiz'
  | 'exercise'
  | 'summary';

export interface QuizItem {
  id: string;
  question: string;
  answer: string;
}

export interface Block {
  id: string;
  type: BlockType;
  text?: string;
  imageDataUrl?: string;
  imageFileName?: string;
  imageCaption?: string;
  videoUrl?: string;
  slideFileName?: string;
  slideFileType?: 'pptx' | 'pdf';
  slideFileSize?: string;
  quizItems?: QuizItem[];
}

export type LessonStatus = 'draft' | 'published';

export interface Lesson {
  id: string;
  name: string;
  duration: string;
  status: LessonStatus;
  blocks: Block[];
}

export interface Chapter {
  id: string;
  name: string;
  description: string;
  lessons: Lesson[];
}

export type SubjectColor = 'violet' | 'green' | 'blue' | 'orange' | 'pink';

export interface Subject {
  id: string;
  name: string;
  description: string;
  color: SubjectColor;
  chapters: Chapter[];
}

export type Route =
  | { name: 'overview' }
  | { name: 'subjects' }
  | { name: 'lesson-editor'; subjectId: string; chapterId: string; lessonId: string }
  | { name: 'lessons' }
  | { name: 'quiz' }
  | { name: 'templates' }
  | { name: 'students' }
  | { name: 'progress' }
  | { name: 'notifications' }
  | { name: 'ai-tools' }
  | { name: 'settings' }
  | { name: 'activity-log' };

export interface Quiz {
  id: string;
  name: string;
  subjectId: string;
  questionCount: number;
  status: LessonStatus;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  subjectId: string;
  thumbnail: string;
  fileName: string;
  status: LessonStatus;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  subject: string;
  progress: number;
  streak: number;
  status: 'active' | 'inactive';
  joinDate: string;
  recentActivity: { action: string; time: string }[];
}

export interface Notification {
  id: string;
  title: string;
  content: string;
  audience: 'Tất cả' | 'Học sinh' | 'Giáo viên';
  date: string;
  status: LessonStatus;
}

export interface ActivityLogEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  time: string;
  type: 'create' | 'update' | 'delete' | 'publish' | 'login';
}
