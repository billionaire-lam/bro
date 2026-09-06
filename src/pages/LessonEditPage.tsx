import { ArrowLeft, Eye, Save } from 'lucide-react';
import { useState } from 'react';
import type { Route } from '../types';
import { findLesson, useStore } from '../store';
import { Button } from '../ui/Button';
import { toast } from '../ui/Toast';

interface LessonEditPageProps {
  route: Extract<Route, { name: 'lesson-edit' }>;
  onBack: () => void;
}

export function LessonEditPage({ route, onBack }: LessonEditPageProps) {
  const { data, updateSubjects } = useStore();
  const lesson = findLesson(data, route.subjectId, route.chapterId, route.lessonId);

  const [previewMode, setPreviewMode] = useState(false);
  const [name, setName] = useState(lesson?.name || '');
  const [description, setDescription] = useState(lesson?.description || '');
  const [content, setContent] = useState(lesson?.content || '');

  if (!lesson) {
    return (
      <div className="page-container">
        <div className="empty-hint">Không tìm thấy bài giảng.</div>
        <Button variant="outline" onClick={onBack}><ArrowLeft size={15} /> Quay lại</Button>
      </div>
    );
  }

  const updateLesson = (updates: Partial<typeof lesson>) => {
    updateSubjects((prev) => prev.map((s) => {
      if (s.id !== route.subjectId) return s;
      return {
        ...s,
        chapters: s.chapters.map((c) => {
          if (c.id !== route.chapterId) return c;
          return { ...c, lessons: c.lessons.map((l) => l.id === route.lessonId ? { ...l, ...updates } : l) };
        }),
      };
    }));
  };

  const handleSave = () => {
    updateLesson({ name: name.trim(), description: description.trim(), content });
    toast('Đã lưu bài giảng');
  };

  if (previewMode) {
    return (
      <div className="page-container">
        <div className="preview-toolbar">
          <Button variant="outline" size="sm" onClick={() => setPreviewMode(false)}><ArrowLeft size={15} /> Quay lại soạn thảo</Button>
          <div className="preview-label">
            <Eye size={15} />
            <span>Xem trước — Giao diện học viên</span>
          </div>
        </div>
        <article className="preview-article">
          <div className="preview-article-head">
            <span className="preview-status">{lesson.status === 'draft' ? 'Bản nháp' : 'Đã xuất bản'}</span>
            <h1>{name}</h1>
            {description && <p className="pv-paragraph" style={{ color: '#8993a4', marginBottom: '8px' }}>{description}</p>}
          </div>
          <div className="preview-blocks">
            {content.trim() ? (
              <p className="pv-paragraph" style={{ whiteSpace: 'pre-wrap' }}>{content}</p>
            ) : (
              <p className="pv-empty-text">Bài giảng chưa có nội dung.</p>
            )}
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="editor-toolbar">
        <div className="editor-toolbar-left">
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft size={15} /> Bài giảng</Button>
          <div className="editor-title">
            <strong>{lesson.name}</strong>
            <span className={`lesson-status ${lesson.status}`}>{lesson.status === 'draft' ? 'Bản nháp' : 'Đã xuất bản'}</span>
          </div>
        </div>
        <div className="editor-toolbar-right">
          <Button variant="outline" size="sm" onClick={() => setPreviewMode(true)}><Eye size={15} /> Xem trước</Button>
          <Button size="sm" onClick={handleSave}><Save size={15} /> Lưu</Button>
        </div>
      </div>

      <div className="lesson-edit-body">
        <div className="form-group">
          <label className="form-label">Tên bài</label>
          <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập tên bài giảng..." />
        </div>
        <div className="form-group">
          <label className="form-label">Mô tả</label>
          <textarea className="form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả ngắn về bài giảng..." rows={2} />
        </div>
        <div className="form-group">
          <label className="form-label">Nội dung</label>
          <textarea className="lesson-edit-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Nhập nội dung bài giảng..." rows={16} />
        </div>
      </div>
    </div>
  );
}
