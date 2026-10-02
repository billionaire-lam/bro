import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit2,
  FileText,
  FolderOpen,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import type { SubjectColor } from '../types';
import { findChapter, useStore } from '../store';
import { AddButton, Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { toast } from '../ui/Toast';

const COLOR_OPTIONS: SubjectColor[] = ['violet', 'green', 'blue', 'orange', 'pink'];

interface SubjectsPageProps {
  onOpenLesson: (subjectId: string, chapterId: string, lessonId: string) => void;
}

export function SubjectsPage({ onOpenLesson }: SubjectsPageProps) {
  const store = useStore();
  const { data, loading } = store;
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  const [modalMode, setModalMode] = useState<'subject' | 'chapter' | 'lesson' | null>(null);
  const [modalEditingId, setModalEditingId] = useState<string | null>(null);
  const [modalContextSubjectId, setModalContextSubjectId] = useState<string | null>(null);
  const [modalContextChapterId, setModalContextChapterId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formColor, setFormColor] = useState<SubjectColor>('violet');
  const [formDuration, setFormDuration] = useState('');
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>('draft');

  const [dragType, setDragType] = useState<'subject' | 'chapter' | 'lesson' | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const openModal = (
    mode: 'subject' | 'chapter' | 'lesson',
    editingId: string | null = null,
    subjectId: string | null = null,
    chapterId: string | null = null,
  ) => {
    setModalMode(mode);
    setModalEditingId(editingId);
    setModalContextSubjectId(subjectId);
    setModalContextChapterId(chapterId);
    if (editingId) {
      if (mode === 'subject') {
        const s = data.find((s) => s.id === editingId);
        setFormName(s?.name || '');
        setFormDesc(s?.description || '');
        setFormColor(s?.color || 'violet');
      } else if (mode === 'chapter') {
        const c = findChapter(data, subjectId || '', chapterId || '');
        setFormName(c?.name || '');
        setFormDesc(c?.description || '');
      } else if (mode === 'lesson') {
        const subj = data.find((s) => s.id === subjectId);
        const ch = subj?.chapters.find((c) => c.id === chapterId);
        const l = ch?.lessons.find((l) => l.id === editingId);
        setFormName(l?.name || '');
        setFormDuration(l?.duration || '');
        setFormStatus(l?.status || 'draft');
      }
    } else {
      setFormName('');
      setFormDesc('');
      setFormColor('violet');
      setFormDuration('20 phút');
      setFormStatus('draft');
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setModalEditingId(null);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast('Vui lòng nhập tên', 'error');
      return;
    }
    try {
      if (modalMode === 'subject') {
        if (modalEditingId) {
          await store.updateSubject(modalEditingId, { name: formName.trim(), description: formDesc.trim(), color: formColor });
          toast('Đã cập nhật môn học');
        } else {
          await store.insertSubject(formName.trim(), formDesc.trim(), formColor);
          toast('Đã thêm môn học mới');
        }
      } else if (modalMode === 'chapter' && modalContextSubjectId) {
        if (modalEditingId) {
          await store.updateChapter(modalEditingId, { name: formName.trim(), description: formDesc.trim() });
          toast('Đã cập nhật chương');
        } else {
          await store.insertChapter(modalContextSubjectId, formName.trim(), formDesc.trim());
          toast('Đã thêm chương mới');
        }
      } else if (modalMode === 'lesson' && modalContextSubjectId && modalContextChapterId) {
        if (modalEditingId) {
          await store.updateLesson(modalEditingId, { name: formName.trim(), duration: formDuration.trim(), status: formStatus });
          toast('Đã cập nhật bài giảng');
        } else {
          await store.insertLesson(modalContextChapterId, formName.trim(), '', formDuration.trim() || '20 phút', formStatus);
          toast('Đã thêm bài giảng mới');
        }
      }
    } catch {
      toast('Lỗi khi lưu', 'error');
    }
    closeModal();
  };

  const deleteSubject = async (id: string) => {
    if (!confirm('Xóa môn học này? Tất cả chương và bài giảng bên trong cũng sẽ bị xóa.')) return;
    await store.deleteSubject(id);
    toast('Đã xóa môn học', 'info');
  };

  const deleteChapter = async (id: string) => {
    if (!confirm('Xóa chương này? Tất cả bài giảng bên trong cũng sẽ bị xóa.')) return;
    await store.deleteChapter(id);
    toast('Đã xóa chương', 'info');
  };

  const deleteLesson = async (id: string) => {
    if (!confirm('Xóa bài giảng này?')) return;
    await store.deleteLesson(id);
    toast('Đã xóa bài giảng', 'info');
  };

  const handleDragStart = (type: typeof dragType, id: string) => {
    setDragType(type);
    setDragId(id);
  };

  const handleReorder = (targetId: string) => {
    if (!dragId || dragId === targetId || !dragType) return;
    if (dragType === 'subject') {
      const from = data.findIndex((s) => s.id === dragId);
      const to = data.findIndex((s) => s.id === targetId);
      if (from !== -1 && to !== -1) store.reorderSubjects(from, to);
    }
    setDragId(null);
    setDragType(null);
    setDragOverId(null);
  };

  const modalTitle = modalMode === 'subject' ? (modalEditingId ? 'Chỉnh sửa môn học' : 'Thêm môn học')
    : modalMode === 'chapter' ? (modalEditingId ? 'Chỉnh sửa chương' : 'Thêm chương')
    : modalMode === 'lesson' ? (modalEditingId ? 'Chỉnh sửa bài giảng' : 'Thêm bài giảng') : '';

  if (loading) {
    return <div className="page-container"><div className="empty-hint">Đang tải...</div></div>;
  }

  return (
    <div className="page-container">
      <div className="page-toolbar">
        <AddButton onClick={() => openModal('subject')}>Thêm môn học</AddButton>
      </div>

      <div className="subject-list">
        {data.map((subject) => {
          const isExpanded = expandedSubject === subject.id;
          const lessonCount = subject.chapters.reduce((sum, c) => sum + c.lessons.length, 0);
          return (
            <div
              key={subject.id}
              className={`content-card ${dragOverId === subject.id ? 'drag-over' : ''}`}
              draggable
              onDragStart={() => handleDragStart('subject', subject.id)}
              onDragEnter={() => setDragOverId(subject.id)}
              onDragEnd={() => { handleReorder(subject.id); }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleReorder(subject.id); }}
            >
              <div className="subject-header">
                <div className="subject-grip"><GripVertical size={16} /></div>
                <button className="subject-expand-btn" onClick={() => setExpandedSubject(isExpanded ? null : subject.id)}>
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                <div className={`subject-color-dot ${subject.color}`} />
                <div className="subject-info">
                  <strong>{subject.name}</strong>
                  <span>{subject.chapters.length} chương · {lessonCount} bài giảng</span>
                </div>
                <div className="card-actions">
                  <button className="card-action-btn" onClick={() => openModal('subject', subject.id)}><Pencil size={14} /> Chỉnh sửa</button>
                  <button className="card-action-btn danger" onClick={() => deleteSubject(subject.id)}><Trash2 size={14} /></button>
                </div>
              </div>
              {subject.description && <p className="subject-desc">{subject.description}</p>}

              {isExpanded && (
                <div className="chapter-list">
                  <div className="sub-toolbar">
                    <span className="sub-toolbar-label">Chương</span>
                    <AddButton onClick={() => openModal('chapter', null, subject.id)}>Thêm chương</AddButton>
                  </div>
                  {subject.chapters.map((chapter) => {
                    const isChExpanded = expandedChapter === chapter.id;
                    return (
                      <div
                        key={chapter.id}
                        className={`chapter-item ${dragOverId === chapter.id ? 'drag-over' : ''}`}
                        draggable
                        onDragStart={() => { setDragType('chapter'); setDragId(chapter.id); setModalContextSubjectId(subject.id); }}
                        onDragEnter={() => { setDragOverId(chapter.id); }}
                        onDragEnd={() => {
                          if (dragType === 'chapter' && dragId && dragId !== chapter.id) store.reorderChapters(subject.id, dragId, chapter.id);
                          setDragId(null); setDragType(null); setDragOverId(null);
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); if (dragType === 'chapter' && dragId && dragId !== chapter.id) store.reorderChapters(subject.id, dragId, chapter.id); setDragId(null); setDragType(null); setDragOverId(null); }}
                      >
                        <div className="chapter-header">
                          <div className="subject-grip"><GripVertical size={15} /></div>
                          <button className="subject-expand-btn sm" onClick={() => setExpandedChapter(isChExpanded ? null : chapter.id)}>
                            {isChExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                          <FolderOpen size={17} className="chapter-icon" />
                          <div className="chapter-info">
                            <strong>{chapter.name}</strong>
                            {chapter.description && <span>{chapter.description}</span>}
                          </div>
                          <div className="card-actions">
                            <button className="card-action-btn" onClick={() => openModal('chapter', chapter.id, subject.id)}><Pencil size={13} /> Chỉnh sửa</button>
                            <button className="card-action-btn danger" onClick={() => deleteChapter(chapter.id)}><Trash2 size={13} /></button>
                          </div>
                        </div>

                        {isChExpanded && (
                          <div className="lesson-list">
                            <div className="sub-toolbar">
                              <span className="sub-toolbar-label">Bài giảng</span>
                              <AddButton onClick={() => openModal('lesson', null, subject.id, chapter.id)}>Thêm bài</AddButton>
                            </div>
                            {chapter.lessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                className={`lesson-item ${dragOverId === lesson.id ? 'drag-over' : ''}`}
                                draggable
                                onDragStart={() => { setDragType('lesson'); setDragId(lesson.id); setModalContextSubjectId(subject.id); setModalContextChapterId(chapter.id); }}
                                onDragEnter={() => setDragOverId(lesson.id)}
                                onDragEnd={() => {
                                  if (dragType === 'lesson' && dragId && dragId !== lesson.id) store.reorderLessons(subject.id, chapter.id, dragId, lesson.id);
                                  setDragId(null); setDragType(null); setDragOverId(null);
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => { e.preventDefault(); if (dragType === 'lesson' && dragId && dragId !== lesson.id) store.reorderLessons(subject.id, chapter.id, dragId, lesson.id); setDragId(null); setDragType(null); setDragOverId(null); }}
                              >
                                <div className="subject-grip"><GripVertical size={14} /></div>
                                <FileText size={15} className="lesson-icon" />
                                <div className="lesson-info">
                                  <strong>{lesson.name}</strong>
                                  <span><Clock size={11} /> {lesson.duration}</span>
                                </div>
                                <span className={`lesson-status ${lesson.status}`}>{lesson.status === 'draft' ? 'Bản nháp' : 'Đã xuất bản'}</span>
                                <div className="card-actions">
                                  <button className="card-action-btn" onClick={() => onOpenLesson(subject.id, chapter.id, lesson.id)}><Edit2 size={13} /> Soạn bài</button>
                                  <button className="card-action-btn" onClick={() => openModal('lesson', lesson.id, subject.id, chapter.id)}><Pencil size={13} /></button>
                                  <button className="card-action-btn danger" onClick={() => deleteLesson(lesson.id)}><Trash2 size={13} /></button>
                                </div>
                              </div>
                            ))}
                            {chapter.lessons.length === 0 && <p className="empty-hint">Chưa có bài giảng nào. Bấm "Thêm bài" để tạo.</p>}
                          </div>
                        )}
</div>
                    );
                  })}
                  {subject.chapters.length === 0 && <p className="empty-hint">Chưa có chương nào. Bấm "Thêm chương" để tạo.</p>}
                </div>
              )}
            </div>
          );
        })}
        {data.length === 0 && <p className="empty-hint">Chưa có môn học nào. Bấm "Thêm môn học" để tạo.</p>}
      </div>

      <Modal
        title={modalTitle}
        open={modalMode !== null}
        onClose={closeModal}
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>Hủy</Button>
            <Button onClick={handleSave}>Lưu</Button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">{modalMode === 'subject' ? 'Tên môn học' : modalMode === 'chapter' ? 'Tên chương' : 'Tên bài giảng'}</label>
          <input className="form-input" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nhập tên..." autoFocus />
        </div>
        {modalMode === 'lesson' ? (
          <>
            <div className="form-group">
              <label className="form-label">Thời lượng</label>
              <input className="form-input" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} placeholder="VD: 20 phút" />
            </div>
            <div className="form-group">
              <label className="form-label">Trạng thái</label>
              <div className="status-toggle">
                <button className={formStatus === 'draft' ? 'active' : ''} onClick={() => setFormStatus('draft')}>Bản nháp</button>
                <button className={formStatus === 'published' ? 'active' : ''} onClick={() => setFormStatus('published')}>Đã xuất bản</button>
              </div>
            </div>
          </>
        ) : (
          <div className="form-group">
            <label className="form-label">Mô tả</label>
            <textarea className="form-textarea" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Nhập mô tả..." rows={3} />
          </div>
        )}
        {modalMode === 'subject' && !modalEditingId && (
          <div className="form-group">
            <label className="form-label">Màu nhận diện</label>
            <div className="color-picker">
              {COLOR_OPTIONS.map((c) => (
                <button key={c} className={`color-option ${c} ${formColor === c ? 'selected' : ''}`} onClick={() => setFormColor(c)} />
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export function PageContainer({ children }: { children: React.ReactNode }) {
  return <div className="page-container">{children}</div>;
}
