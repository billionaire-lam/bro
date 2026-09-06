import { useCallback, useEffect, useState } from 'react';
import type { ActivityLogEntry, Block, BlockType, Chapter, Lesson, Notification, Quiz, Student, Subject, Template } from './types';
import { mockActivityLog, mockNotifications, mockQuizzes, mockStudents, mockTemplates } from './mockData';

const SUBJECTS_KEY = 'studyhub-content-v1';
const APP_KEY = 'studyhub-app-data-v1';

export const BLOCK_LABELS: Record<BlockType, string> = {
  heading: 'Tiêu đề',
  paragraph: 'Đoạn văn',
  explanation: 'Giải thích',
  example: 'Ví dụ',
  formula: 'Công thức',
  tip: 'Mẹo nhớ',
  image: 'Hình ảnh',
  video: 'Video',
  slide: 'Slide',
  quiz: 'Quiz',
  exercise: 'Bài tập',
  summary: 'Tóm tắt',
};

const sampleBlocks: Block[] = [
  { id: 'b1', type: 'heading', text: 'Bài 1 — Khái niệm phân thức' },
  { id: 'b2', type: 'explanation', text: 'Phân thức đại số là biểu thức có dạng A/B, trong đó A, B là các đa thức và B khác 0.' },
  { id: 'b3', type: 'example', text: 'Ví dụ: x/y, (x+1)/(x-2), 5/(x^2+1) là các phân thức đại số.' },
  { id: 'b4', type: 'formula', text: 'A/B = A·C / B·C (với C ≠ 0)' },
  { id: 'b5', type: 'summary', text: 'Nhớ: Mẫu thức luôn phải khác 0.' },
];

const initialSubjects: Subject[] = [
  {
    id: 's1',
    name: 'Toán 8',
    description: 'Toán học lớp 8 — Đại số và Hình học cơ bản',
    color: 'violet',
    chapters: [
      {
        id: 'c1',
        name: 'Chương 1 — Phân thức đại số',
        description: 'Giới thiệu phân thức đại số và các phép tính cơ bản',
        lessons: [
          { id: 'l1', name: 'Bài 1 — Khái niệm phân thức', description: 'Giới thiệu khái niệm phân thức đại số và các tính chất cơ bản.', content: '', duration: '20 phút', status: 'published', blocks: sampleBlocks },
          { id: 'l2', name: 'Bài 2 — Tính chất cơ bản của phân thức', description: 'Tính chất cơ bản của phân thức đại số và quy tắc rút gọn.', content: '', duration: '18 phút', status: 'draft', blocks: [ { id: 'l2b1', type: 'heading', text: 'Bài 2 — Tính chất cơ bản' } ] },
        ],
      },
      {
        id: 'c2',
        name: 'Chương 2 — Hàm số và đồ thị',
        description: 'Khái niệm hàm số và đồ thị hàm số bậc nhất',
        lessons: [
          { id: 'l3', name: 'Bài 1 — Khái niệm hàm số', description: 'Giới thiệu khái niệm hàm số và đồ thị.', content: '', duration: '22 phút', status: 'published', blocks: [ { id: 'l3b1', type: 'heading', text: 'Khái niệm hàm số' } ] },
        ],
      },
    ],
  },
  {
    id: 's2',
    name: 'Ngữ văn 8',
    description: 'Ngữ văn lớp 8 — Văn học và Tiếng Việt',
    color: 'green',
    chapters: [
      {
        id: 'c3',
        name: 'Chương 1 — Văn học hiện đại',
        description: 'Các tác phẩm văn học hiện đại Việt Nam',
        lessons: [
          { id: 'l4', name: 'Bài 1 — Vẻ đẹp của một bài ca dao', description: 'Phân tích vẻ đẹp của một bài ca dao Việt Nam.', content: '', duration: '25 phút', status: 'published', blocks: [ { id: 'l4b1', type: 'heading', text: 'Vẻ đẹp của một bài ca dao' } ] },
        ],
      },
    ],
  },
  {
    id: 's3',
    name: 'Tiếng Anh 8',
    description: 'Tiếng Anh lớp 8 — Kỹ năng ngôn ngữ',
    color: 'blue',
    chapters: [
      {
        id: 'c4',
        name: 'Unit 1 — My Hobbies',
        description: 'Giới thiệu về sở thích cá nhân',
        lessons: [
          { id: 'l5', name: 'Lesson 1 — Getting Started', description: 'Giới thiệu chủ đề sở thích cá nhân bằng tiếng Anh.', content: '', duration: '15 phút', status: 'published', blocks: [ { id: 'l5b1', type: 'heading', text: 'Getting Started' } ] },
        ],
      },
    ],
  },
];

interface AppData {
  quizzes: Quiz[];
  templates: Template[];
  students: Student[];
  notifications: Notification[];
  activityLog: ActivityLogEntry[];
}

const initialAppData: AppData = {
  quizzes: mockQuizzes,
  templates: mockTemplates,
  students: mockStudents,
  notifications: mockNotifications,
  activityLog: mockActivityLog,
};

let listeners: (() => void)[] = [];
let memorySubjects: Subject[] | null = null;
let memoryAppData: AppData | null = null;

function loadSubjects(): Subject[] {
  if (memorySubjects) return memorySubjects;
  try {
    const raw = localStorage.getItem(SUBJECTS_KEY);
    if (raw) {
      memorySubjects = JSON.parse(raw) as Subject[];
      return memorySubjects;
    }
  } catch { /* ignore */ }
  memorySubjects = initialSubjects;
  return memorySubjects;
}

function saveSubjects(data: Subject[]) {
  memorySubjects = data;
  try { localStorage.setItem(SUBJECTS_KEY, JSON.stringify(data)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

function loadAppData(): AppData {
  if (memoryAppData) return memoryAppData;
  try {
    const raw = localStorage.getItem(APP_KEY);
    if (raw) {
      memoryAppData = JSON.parse(raw) as AppData;
      return memoryAppData;
    }
  } catch { /* ignore */ }
  memoryAppData = initialAppData;
  return memoryAppData;
}

function saveAppData(data: AppData) {
  memoryAppData = data;
  try { localStorage.setItem(APP_KEY, JSON.stringify(data)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export function useStore() {
  const [subjects, setSubjects] = useState<Subject[]>(loadSubjects);
  const [appData, setAppData] = useState<AppData>(loadAppData);

  useEffect(() => {
    const listener = () => {
      setSubjects(loadSubjects());
      setAppData(loadAppData());
    };
    listeners.push(listener);
    return () => { listeners = listeners.filter((l) => l !== listener); };
  }, []);

  const updateSubjects = useCallback((updater: (prev: Subject[]) => Subject[]) => {
    saveSubjects(updater(loadSubjects()));
  }, []);

  const updateAppData = useCallback((updater: (prev: AppData) => AppData) => {
    saveAppData(updater(loadAppData()));
  }, []);

  return {
    data: subjects,
    updateSubjects,
    quizzes: appData.quizzes,
    templates: appData.templates,
    students: appData.students,
    notifications: appData.notifications,
    activityLog: appData.activityLog,
    updateQuizzes: useCallback((fn: (prev: Quiz[]) => Quiz[]) => updateAppData((d) => ({ ...d, quizzes: fn(d.quizzes) })), [updateAppData]),
    updateTemplates: useCallback((fn: (prev: Template[]) => Template[]) => updateAppData((d) => ({ ...d, templates: fn(d.templates) })), [updateAppData]),
    updateStudents: useCallback((fn: (prev: Student[]) => Student[]) => updateAppData((d) => ({ ...d, students: fn(d.students) })), [updateAppData]),
    updateNotifications: useCallback((fn: (prev: Notification[]) => Notification[]) => updateAppData((d) => ({ ...d, notifications: fn(d.notifications) })), [updateAppData]),
    updateActivityLog: useCallback((fn: (prev: ActivityLogEntry[]) => ActivityLogEntry[]) => updateAppData((d) => ({ ...d, activityLog: fn(d.activityLog) })), [updateAppData]),
  };
}

let idCounter = 0;
export function genId(prefix: string): string {
  idCounter += 1;
  return `${prefix}${Date.now().toString(36)}${idCounter}`;
}

export function createBlock(type: BlockType): Block {
  const base: Block = { id: genId('b'), type };
  if (type === 'quiz') base.quizItems = [{ id: genId('q'), question: '', answer: '' }];
  return base;
}

export function moveArray<T>(arr: T[], from: number, to: number): T[] {
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export function findSubject(data: Subject[], id: string): Subject | undefined {
  return data.find((s) => s.id === id);
}

export function findChapter(data: Subject[], subjectId: string, chapterId: string): Chapter | undefined {
  return findSubject(data, subjectId)?.chapters.find((c) => c.id === chapterId);
}

export function findLesson(
  data: Subject[],
  subjectId: string,
  chapterId: string,
  lessonId: string,
): Lesson | undefined {
  return findChapter(data, subjectId, chapterId)?.lessons.find((l) => l.id === lessonId);
}

export function countAllLessons(data: Subject[]): number {
  return data.reduce((sum, s) => sum + s.chapters.reduce((cs, c) => cs + c.lessons.length, 0), 0);
}
