import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Quiz } from '../types';
import { genId, useStore } from '../store';
import { AddButton, Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { DataTable, EmptyState, FilterBar, SearchInput, Select, StatusBadge } from '../ui/PageComponents';
import { toast } from '../ui/Toast';

export function QuizPage() {
  const { quizzes, updateQuizzes } = useStore();
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formCount, setFormCount] = useState('10');
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>('draft');

  const subjectNames = Array.from(new Set(quizzes.map((q) => q.subjectId)));

  const filtered = quizzes.filter((q) => {
    if (search && !q.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (subjectFilter && q.subjectId !== subjectFilter) return false;
    if (statusFilter && q.status !== statusFilter) return false;
    return true;
  });

  const openAdd = () => {
    setEditingId(null);
    setFormName('');
    setFormSubject(subjectNames[0] || '');
    setFormCount('10');
    setFormStatus('draft');
    setModalOpen(true);
  };

  const openEdit = (q: Quiz) => {
    setEditingId(q.id);
    setFormName(q.name);
    setFormSubject(q.subjectId);
    setFormCount(String(q.questionCount));
    setFormStatus(q.status);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) {
      toast('Vui lòng nhập tên quiz', 'error');
      return;
    }
    if (editingId) {
      updateQuizzes((prev) => prev.map((q) => q.id === editingId ? { ...q, name: formName.trim(), subjectId: formSubject, questionCount: Number(formCount) || 0, status: formStatus } : q));
      toast('Đã cập nhật quiz');
    } else {
      const newQuiz: Quiz = { id: genId('q'), name: formName.trim(), subjectId: formSubject, questionCount: Number(formCount) || 0, status: formStatus };
      updateQuizzes((prev) => [...prev, newQuiz]);
      toast('Đã thêm quiz mới');
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Xóa quiz này?')) return;
    updateQuizzes((prev) => prev.filter((q) => q.id !== id));
    toast('Đã xóa quiz', 'info');
  };

  const toggleStatus = (id: string) => {
    updateQuizzes((prev) => prev.map((q) => q.id === id ? { ...q, status: q.status === 'draft' ? 'published' : 'draft' } : q));
  };

  return (
    <div className="page-container">
      <div className="page-toolbar"><AddButton onClick={openAdd}>Thêm Quiz</AddButton></div>
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm quiz..." />
        <Select value={subjectFilter} onChange={setSubjectFilter} options={subjectNames.map((s) => ({ value: s, label: s }))} allLabel="Tất cả môn học" />
        <Select value={statusFilter} onChange={setStatusFilter} options={[{ value: 'draft', label: 'Nháp' }, { value: 'published', label: 'Đã xuất bản' }]} allLabel="Tất cả trạng thái" />
      </FilterBar>
      {filtered.length === 0 ? <EmptyState message="Không tìm thấy quiz nào." /> : (
        <DataTable headers={['Tên Quiz', 'Môn học', 'Số câu hỏi', 'Trạng thái', '']}>
          {filtered.map((q) => (
            <tr key={q.id}>
              <td><strong>{q.name}</strong></td>
              <td>{q.subjectId}</td>
              <td>{q.questionCount}</td>
              <td><button className="status-clickable" onClick={() => toggleStatus(q.id)}><StatusBadge status={q.status} /></button></td>
              <td>
                <div className="row-actions">
                  <button className="row-action-btn" onClick={() => openEdit(q)}><Edit2 size={14} /> Sửa</button>
                  <button className="row-action-btn danger" onClick={() => handleDelete(q.id)}><Trash2 size={14} /></button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
      <Modal
        title={editingId ? 'Sửa Quiz' : 'Thêm Quiz'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={<><Button variant="outline" onClick={() => setModalOpen(false)}>Hủy</Button><Button onClick={handleSave}>Lưu</Button></>}
      >
        <div className="form-group">
          <label className="form-label">Tên Quiz</label>
          <input className="form-input" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="VD: Quiz: Hàm số bậc nhất" autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Môn học</label>
          <input className="form-input" value={formSubject} onChange={(e) => setFormSubject(e.target.value)} placeholder="VD: Toán 8" />
        </div>
        <div className="form-group">
          <label className="form-label">Số câu hỏi</label>
          <input className="form-input" type="number" min="1" value={formCount} onChange={(e) => setFormCount(e.target.value)} />
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
