import { useCallback, useEffect, useRef, useState } from 'react';
import type { ActivityLogEntry, Block, BlockType, Chapter, Lesson, Notification, Quiz, Student, Subject, SubjectColor, Template } from './types';
import { mockActivityLog, mockNotifications, mockQuizzes, mockStudents, mockTemplates } from './mockData';
import { supabase } from './supabaseClient';

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
  question: 'Câu hỏi',
  exercise: 'Bài tập',
  quiz: 'Quiz',
  summary: 'Tóm tắt',
};

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

const APP_KEY = 'studyhub-app-data-v1';

let listeners: (() => void)[] = [];
let memoryAppData: AppData | null = null;

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

let idCounter = 0;
export function genId(prefix: string): string {
  idCounter += 1;
  return `${prefix}${Date.now().toString(36)}${idCounter}`;
}

function blockToData(b: Block): Record<string, unknown> {
  const { id: _id, type: _type, ...rest } = b;
  return rest as Record<string, unknown>;
}

function dataToBlock(id: string, type: BlockType, data: Record<string, unknown>): Block {
  return { id, type, ...data } as Block;
}

// ===== Database fetch =====

async function fetchSubjectsTree(): Promise<Subject[]> {
  const { data: subjects } = await supabase.from('subjects').select('*').order('sort_order');
  if (!subjects || subjects.length === 0) return [];

  const subjectIds = subjects.map((s) => s.id);
  const { data: chapters } = await supabase.from('chapters').select('*').in('subject_id', subjectIds).order('sort_order');

  const chapterIds = chapters?.map((c) => c.id) || [];
  const { data: lessons } = chapterIds.length > 0
    ? await supabase.from('lessons').select('*').in('chapter_id', chapterIds).order('sort_order')
    : { data: [] };

  const lessonIds = lessons?.map((l) => l.id) || [];
  const { data: blocks } = lessonIds.length > 0
    ? await supabase.from('lesson_blocks').select('*').in('lesson_id', lessonIds).order('order_index')
    : { data: [] };

  return subjects.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description || '',
    color: (s.color as SubjectColor) || 'violet',
    chapters: (chapters || []).filter((c) => c.subject_id === s.id).map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description || '',
      lessons: (lessons || []).filter((l) => l.chapter_id === c.id).map((l) => ({
        id: l.id,
        name: l.name,
        description: l.description || '',
        content: '',
        duration: l.duration || '20 phút',
        status: (l.status as Lesson['status']) || 'draft',
        blocks: (blocks || []).filter((b) => b.lesson_id === l.id).map((b) =>
          dataToBlock(b.id, b.block_type as BlockType, b.data as Record<string, unknown>),
        ),
      })),
    })),
  })) as Subject[];
}

// ===== Database CRUD: Subjects =====

async function dbInsertSubject(name: string, description: string, color: SubjectColor, sortOrder: number): Promise<string> {
  const { data, error } = await supabase.from('subjects').insert({
    name, description, color, sort_order: sortOrder,
  }).select('id').single();
  if (error) throw error;
  return data!.id;
}

async function dbUpdateSubject(id: string, patch: { name?: string; description?: string; color?: string }) {
  const { error } = await supabase.from('subjects').update(patch).eq('id', id);
  if (error) throw error;
}

async function dbDeleteSubject(id: string) {
  const { error } = await supabase.from('subjects').delete().eq('id', id);
  if (error) throw error;
}

// ===== Database CRUD: Chapters =====

async function dbInsertChapter(subjectId: string, name: string, description: string, sortOrder: number): Promise<string> {
  const { data, error } = await supabase.from('chapters').insert({
    subject_id: subjectId, name, description, sort_order: sortOrder,
  }).select('id').single();
  if (error) throw error;
  return data!.id;
}

async function dbUpdateChapter(id: string, patch: { name?: string; description?: string }) {
  const { error } = await supabase.from('chapters').update(patch).eq('id', id);
  if (error) throw error;
}

async function dbDeleteChapter(id: string) {
  const { error } = await supabase.from('chapters').delete().eq('id', id);
  if (error) throw error;
}

// ===== Database CRUD: Lessons =====

async function dbInsertLesson(chapterId: string, name: string, description: string, duration: string, status: string, sortOrder: number): Promise<string> {
  const { data, error } = await supabase.from('lessons').insert({
    chapter_id: chapterId, name, description, duration, status, sort_order: sortOrder,
  }).select('id').single();
  if (error) throw error;
  return data!.id;
}

async function dbUpdateLesson(id: string, patch: { name?: string; description?: string; duration?: string; status?: string; chapter_id?: string }) {
  const { error } = await supabase.from('lessons').update(patch).eq('id', id);
  if (error) throw error;
}

async function dbDeleteLesson(id: string) {
  const { error } = await supabase.from('lessons').delete().eq('id', id);
  if (error) throw error;
}

// ===== Database CRUD: Lesson Blocks =====

async function dbInsertBlock(lessonId: string, block: Block, orderIndex: number): Promise<string> {
  const { data, error } = await supabase.from('lesson_blocks').insert({
    lesson_id: lessonId, block_type: block.type, order_index: orderIndex, data: blockToData(block),
  }).select('id').single();
  if (error) throw error;
  return data!.id;
}

async function dbUpdateBlock(id: string, patch: { block_type?: string; order_index?: number; data?: Record<string, unknown> }) {
  const { error } = await supabase.from('lesson_blocks').update(patch).eq('id', id);
  if (error) throw error;
}

async function dbUpdateBlockData(id: string, block: Block) {
  const { error } = await supabase.from('lesson_blocks').update({ data: blockToData(block) }).eq('id', id);
  if (error) throw error;
}

async function dbDeleteBlock(id: string) {
  const { error } = await supabase.from('lesson_blocks').delete().eq('id', id);
  if (error) throw error;
}

async function dbSyncBlockOrder(lessonId: string, blocks: Block[]) {
  const updates = blocks.map((b, i) =>
    supabase.from('lesson_blocks').update({ order_index: i }).eq('id', b.id),
  );
  await Promise.all(updates);
}

// ===== Hook =====

export function useStore() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [appData, setAppData] = useState<AppData>(loadAppData);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  const refresh = useCallback(async () => {
    const tree = await fetchSubjectsTree();
    setSubjects(tree);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    refresh();
    const listener = () => setAppData(loadAppData());
    listeners.push(listener);
    return () => { listeners = listeners.filter((l) => l !== listener); };
  }, [refresh]);

  const updateAppData = useCallback((updater: (prev: AppData) => AppData) => {
    saveAppData(updater(loadAppData()));
  }, []);

  const reload = useCallback(() => { refresh(); }, [refresh]);

  // ===== Subject CRUD with DB persistence =====
  const insertSubject = useCallback(async (name: string, description: string, color: SubjectColor): Promise<string> => {
    const sortOrder = subjects.length;
    const id = await dbInsertSubject(name, description, color, sortOrder);
    await refresh();
    return id;
  }, [subjects.length, refresh]);

  const updateSubject = useCallback(async (id: string, patch: { name?: string; description?: string; color?: SubjectColor }) => {
    setSubjects((prev) => prev.map((s) => s.id === id ? { ...s, ...patch } : s));
    await dbUpdateSubject(id, patch as { name?: string; description?: string; color?: string });
  }, []);

  const deleteSubject = useCallback(async (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    await dbDeleteSubject(id);
  }, []);

  const reorderSubjects = useCallback(async (from: number, to: number) => {
    setSubjects((prev) => {
      const next = moveArray(prev, from, to);
      next.forEach((s, i) => supabase.from('subjects').update({ sort_order: i }).eq('id', s.id));
      return next;
    });
  }, []);

  // ===== Chapter CRUD =====
  const insertChapter = useCallback(async (subjectId: string, name: string, description: string): Promise<string> => {
    const subj = subjects.find((s) => s.id === subjectId);
    const sortOrder = subj?.chapters.length || 0;
    const id = await dbInsertChapter(subjectId, name, description, sortOrder);
    await refresh();
    return id;
  }, [subjects, refresh]);

  const updateChapter = useCallback(async (id: string, patch: { name?: string; description?: string }) => {
    setSubjects((prev) => prev.map((s) => ({
      ...s,
      chapters: s.chapters.map((c) => c.id === id ? { ...c, ...patch } : c),
    })));
    await dbUpdateChapter(id, patch);
  }, []);

  const deleteChapter = useCallback(async (id: string) => {
    setSubjects((prev) => prev.map((s) => ({
      ...s,
      chapters: s.chapters.filter((c) => c.id !== id),
    })));
    await dbDeleteChapter(id);
  }, []);

  const reorderChapters = useCallback(async (subjectId: string, fromId: string, toId: string) => {
    setSubjects((prev) => prev.map((s) => {
      if (s.id !== subjectId) return s;
      const from = s.chapters.findIndex((c) => c.id === fromId);
      const to = s.chapters.findIndex((c) => c.id === toId);
      if (from === -1 || to === -1) return s;
      const next = moveArray(s.chapters, from, to);
      next.forEach((c, i) => supabase.from('chapters').update({ sort_order: i }).eq('id', c.id));
      return { ...s, chapters: next };
    }));
  }, []);

  // ===== Lesson CRUD =====
  const insertLesson = useCallback(async (chapterId: string, name: string, description: string, duration: string, status: 'draft' | 'published'): Promise<string> => {
    const subj = subjects.find((s) => s.chapters.some((c) => c.id === chapterId));
    const ch = subj?.chapters.find((c) => c.id === chapterId);
    const sortOrder = ch?.lessons.length || 0;
    const id = await dbInsertLesson(chapterId, name, description, duration, status, sortOrder);
    await refresh();
    return id;
  }, [subjects, refresh]);

  const updateLesson = useCallback(async (id: string, patch: { name?: string; description?: string; duration?: string; status?: string; chapter_id?: string }) => {
    setSubjects((prev) => prev.map((s) => ({
      ...s,
      chapters: s.chapters.map((c) => ({
        ...c,
        lessons: c.lessons.map((l) => l.id === id ? { ...l, ...patch } as Lesson : l),
      })),
    })));
    await dbUpdateLesson(id, patch);
  }, []);

  const deleteLesson = useCallback(async (id: string) => {
    setSubjects((prev) => prev.map((s) => ({
      ...s,
      chapters: s.chapters.map((c) => ({
        ...c,
        lessons: c.lessons.filter((l) => l.id !== id),
      })),
    })));
    await dbDeleteLesson(id);
  }, []);

  const reorderLessons = useCallback(async (subjectId: string, chapterId: string, fromId: string, toId: string) => {
    setSubjects((prev) => prev.map((s) => {
      if (s.id !== subjectId) return s;
      return {
        ...s,
        chapters: s.chapters.map((c) => {
          if (c.id !== chapterId) return c;
          const from = c.lessons.findIndex((l) => l.id === fromId);
          const to = c.lessons.findIndex((l) => l.id === toId);
          if (from === -1 || to === -1) return c;
          const next = moveArray(c.lessons, from, to);
          next.forEach((l, i) => supabase.from('lessons').update({ sort_order: i }).eq('id', l.id));
          return { ...c, lessons: next };
        }),
      };
    }));
  }, []);

  // ===== Block CRUD =====
  const insertBlock = useCallback(async (lessonId: string, block: Block): Promise<string> => {
    const lesson = findLessonById(subjects, lessonId);
    const orderIndex = lesson?.blocks.length || 0;
    const id = await dbInsertBlock(lessonId, block, orderIndex);
    setSubjects((prev) => prev.map((s) => ({
      ...s,
      chapters: s.chapters.map((c) => ({
        ...c,
        lessons: c.lessons.map((l) => l.id === lessonId ? { ...l, blocks: [...l.blocks, { ...block, id }] } : l),
      })),
    })));
    return id;
  }, [subjects, refresh]);

  const updateBlock = useCallback(async (lessonId: string, blockId: string, block: Block) => {
    setSubjects((prev) => prev.map((s) => ({
      ...s,
      chapters: s.chapters.map((c) => ({
        ...c,
        lessons: c.lessons.map((l) => l.id === lessonId ? {
          ...l,
          blocks: l.blocks.map((b) => b.id === blockId ? block : b),
        } : l),
      })),
    })));
    await dbUpdateBlockData(blockId, block);
  }, []);

  const deleteBlock = useCallback(async (lessonId: string, blockId: string) => {
    setSubjects((prev) => prev.map((s) => ({
      ...s,
      chapters: s.chapters.map((c) => ({
        ...c,
        lessons: c.lessons.map((l) => l.id === lessonId ? {
          ...l,
          blocks: l.blocks.filter((b) => b.id !== blockId),
        } : l),
      })),
    })));
    await dbDeleteBlock(blockId);
  }, []);

  const reorderBlocks = useCallback(async (lessonId: string, from: number, to: number) => {
    let reorderedBlocks: Block[] = [];
    setSubjects((prev) => prev.map((s) => ({
      ...s,
      chapters: s.chapters.map((c) => ({
        ...c,
        lessons: c.lessons.map((l) => {
          if (l.id !== lessonId) return l;
          reorderedBlocks = moveArray(l.blocks, from, to);
          return { ...l, blocks: reorderedBlocks };
        }),
      })),
    })));
    if (reorderedBlocks.length > 0) {
      await dbSyncBlockOrder(lessonId, reorderedBlocks);
    }
  }, []);

  return {
    data: subjects,
    loading,
    reload,
    // Subject CRUD
    insertSubject,
    updateSubject,
    deleteSubject,
    reorderSubjects,
    // Chapter CRUD
    insertChapter,
    updateChapter,
    deleteChapter,
    reorderChapters,
    // Lesson CRUD
    insertLesson,
    updateLesson,
    deleteLesson,
    reorderLessons,
    // Block CRUD
    insertBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    // App data (localStorage)
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

// ===== Helpers =====

function findLessonById(data: Subject[], lessonId: string): Lesson | undefined {
  for (const s of data) {
    for (const c of s.chapters) {
      const l = c.lessons.find((l) => l.id === lessonId);
      if (l) return l;
    }
  }
  return undefined;
}

export function createBlock(type: BlockType): Block {
  const id = genId('b');
  const base: Block = { id, type };
  if (type === 'question') {
    base.questionText = '';
    base.questionChoices = [
      { id: genId('ch'), text: '', correct: true },
      { id: genId('ch'), text: '', correct: false },
    ];
    base.questionCorrectIndex = 0;
  }
  if (type === 'exercise') {
    base.exerciseQuestion = '';
    base.exerciseAnswerType = 'text';
    base.exerciseAnswer = '';
    base.exerciseExplanation = '';
  }
  if (type === 'quiz') {
    base.quizItems = [{
      id: genId('q'),
      question: '',
      choices: [
        { id: genId('ch'), text: '', correct: true },
        { id: genId('ch'), text: '', correct: false },
      ],
      explanation: '',
    }];
  }
  if (type === 'summary') {
    base.summaryItems = [''];
  }
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

export { blockToData };
