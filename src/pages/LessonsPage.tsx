import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Lesson } from '../types';
import { findChapter, findSubject, genId, useStore } from '../store';
import { AddButton, Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { DataTable, EmptyState, FilterBar, SearchInput, Select, StatusBadge } from '../ui/PageComponents';
import { toast } from '../ui/Toast';

interface Props {
  onEditLesson: (subjectId: string, chapterId: string, lessonId: string) => void;
}

interface FlatLesson extends Lesson {
  subjectId: string;
  subjectName: string;
  chapterId: string;
  chapterName: string;
}

export function LessonsPage({ onEditLesson }: Props) {
  const { data, updateSubjects } = useStore();
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [chapterFilter, setChapterFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FlatLesson | null>(null);
  const [formName, setFormName] = useState('');
  const [formDuration, setFormDuration] = useState('20 phút');
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>('draft');
  const [formSubject, setFormSubject] = useState('');
  const [formChapter, setFormChapter] = useState('');

  const flatLessons: FlatLesson[] = useMemo(() => {
    const result: FlatLesson[] = [];
    data.forEach((s) => {
      s.chapters.forEach((c) => {
        c.lessons.forEach((l) => {
          result.push({ ...l, subjectId: s.id, subjectName: s.name, chapterId: c.id, chapterName: c.name });
        });
      });
    });
    return result;
  }, [data]);

  const chaptersForSubject = useMemo(() => {
    const subj = data.find((s) => s.id === formSubject);
    return subj?.chapters || [];
  }, [data, formSubject]);

  const filtered = useMemo(() => {
    return flatLessons.filter((l) => {
      if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (subjectFilter && l.subjectId !== subjectFilter) return false;
      if (chapterFilter && l.chapterId !== chapterFilter) return false;
      return true;
    });
  }, [flatLessons, search, subjectFilter, chapterFilter]);

  const openAdd = () => {
    setEditing(null);
    setFormName('');
    setFormDuration('20 phút');
    setFormStatus('draft');
    setFormSubject(data[0]?.id || '');
    setFormChapter(data[0]?.chapters[0]?.id || '');
    setModalOpen(true);
  };

  const openEdit = (lesson: FlatLesson) => {
    setEditing(lesson);
    setFormName(lesson.name);
    setFormDuration(lesson.duration);
    setFormStatus(lesson.status);
    setFormSubject(lesson.subjectId);
    setFormChapter(lesson.chapterId);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formSubject || !formChapter) {
      toast('Vui lòng nhập đủ thông tin', 'error');
      return;
    }
    if (editing) {
      if (editing.subjectId === formSubject && editing.chapterId === formChapter) {
        updateSubjects((prev) => prev.map((s) => s.id === formSubject ? {
          ...s,
          chapters: s.chapters.map((c) => c.id === formChapter ? {
            ...c,
            lessons: c.lessons.map((l) => l.id === editing.id ? { ...l, name: formName.trim(), duration: formDuration.trim(), status: formStatus } : l),
          } : c),
        } : s));
      } else {
        updateSubjects((prev) => prev.map((s) => {
          if (s.id === editing.subjectId) {
            return { ...s, chapters: s.chapters.map((c) => c.id === editing.chapterId ? { ...c, lessons: c.lessons.filter((l) => l.id !== editing.id) } : c) };
          }
          if (s.id === formSubject) {
            const moved = { ...editing, name: formName.trim(), duration: formDuration.trim(), status: formStatus };
            return { ...s, chapters: s.chapters.map((c) => c.id === formChapter ? { ...c, lessons: [...c.lessons, moved] } : c) };
          }
          return s;
        }));
      }
      toast('Đã cập nhật bài giảng');
    } else {
      const newLesson: Lesson = { id: genId('l'), name: formName.trim(), duration: formDuration.trim(), status: formStatus, blocks: [] };
      updateSubjects((prev) => prev.map((s) => s.id === formSubject ? {
        ...s,
        chapters: s.chapters.map((c) => c.id === formChapter ? { ...c, lessons: [...c.lessons, newLesson] } : c),
      } : s));
      toast('Đã thêm bài giảng');
    }
    setModalOpen(false);
  };

  const handleDelete = (lesson: FlatLesson) => {
    if (!confirm('Xóa bài giảng này?')) return;
    updateSubjects((prev) => prev.map((s) => s.id === lesson.subjectId ? {
      ...s,
      chapters: s.chapters.map((c) => c.id === lesson.chapterId ? { ...c, lessons: c.lessons.filter((l) => l.id !== lesson.id) } : c),
    } : s));
    toast('Đã xóa bài giảng', 'info');
  };

  const toggleStatus = (lesson: FlatLesson) => {
    const newStatus = lesson.status === 'draft' ? 'published' : 'draft';
    updateSubjects((prev) => prev.map((s) => s.id === lesson.subjectId ? {
      ...s,
      chapters: s.chapters.map((c) => c.id === lesson.chapterId ? {
        ...c,
        lessons: c.lessons.map((l) => l.id === lesson.id ? { ...l, status: newStatus } : l),
      } : c),
    } : s));
    toast(newStatus === 'published' ? 'Đã xuất bản' : 'Đã chuyển sang nháp');
  };

  return (
    <div className="page-container">
      <div className="page-toolbar">
        <AddButton onClick={openAdd}>Thêm bài giảng</AddButton>
      </div>
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm bài giảng..." />
        <Select value={subjectFilter} onChange={(v) => { setSubjectFilter(v); setChapterFilter(''); }} options={data.map((s) => ({ value: s.id, label: s.name }))} allLabel="Tất cả môn học" />
        <Select value={chapterFilter} onChange={setChapterFilter} options={(data.find((s) => s.id === subjectFilter)?.chapters || []).map((c) => ({ value: c.id, label: c.name }))} allLabel="Tất cả chương" />
      </FilterBar>
      {filtered.length === 0 ? (
        <EmptyState message="Không tìm thấy bài giảng nào." />
      ) : (
        <DataTable headers={['Tên bài giảng', 'Môn học', 'Chương', 'Thời lượng', 'Trạng thái', '']}>
          {filtered.map((lesson) => (
            <tr key={lesson.id}>
              <td><strong>{lesson.name}</strong></td>
              <td>{lesson.subjectName}</td>
              <td>{lesson.chapterName}</td>
              <td>{lesson.duration}</td>
              <td><button className="status-clickable" onClick={() => toggleStatus(lesson)}><StatusBadge status={lesson.status} /></button></td>
              <td>
                <div className="row-actions">
                  <button className="row-action-btn" onClick={() => onEditLesson(lesson.subjectId, lesson.chapterId, lesson.id)}><Edit2 size={14} /> Editor</button>
                  <button className="row-action-btn" onClick={() => openEdit(lesson)}><Plus size={14} /> Sửa</button>
                  <button className="row-action-btn danger" onClick={() => handleDelete(lesson)}><Trash2 size={14} /></button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
      <Modal
        title={editing ? 'Sửa bài giảng' : 'Thêm bài giảng'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={<><Button variant="outline" onClick={() => setModalOpen(false)}>Hủy</Button><Button onClick={handleSave}>Lưu</Button></>}
      >
        <div className="form-group">
          <label className="form-label">Tên bài giảng</label>
          <input className="form-input" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nhập tên bài giảng..." autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Môn học</label>
          <select className="form-input" value={formSubject} onChange={(e) => { setFormSubject(e.target.value); setFormChapter(data.find((s) => s.id === e.target.value)?.chapters[0]?.id || ''); }}>
            {data.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Chương</label>
          <select className="form-input" value={formChapter} onChange={(e) => setFormChapter(e.target.value)}>
            {chaptersForSubject.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Thời lượng</label>
          <input className="form-input" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} placeholder="VD: 20 phút" />
        </div>
        <div className="form-group">
          <label className="form-label">Trạng thái</label>
          <div className="status-toggle">
            <button className={formStatus === 'draft' ? 'active' : ''} onClick={() => setFormStatus('draft')}>Nháp</button>
            <button className={formStatus === 'published' ? 'active' : ''} onClick={() => setFormStatus('published')}>Đã xuất bản</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
