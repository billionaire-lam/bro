import { BookOpen, FileText, Edit2, Plus, Trash2, Download } from 'lucide-react';
import { useState } from 'react';
import type { Template } from '../types';
import { mockTemplates, SUBJECT_NAMES } from '../mockData';
import { AddButton, Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { EmptyState, FilterBar, SearchInput, Select, StatusBadge } from '../ui/PageComponents';
import { toast } from '../ui/Toast';

let tplIdCounter = 100;

const THUMB_ICONS: Record<string, string> = {
  books: '📚', math: '📐', nature: '🌿', science: '🔬', history: '🏛️', algebra: '➗',
};

export function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>(mockTemplates);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formSubject, setFormSubject] = useState(SUBJECT_NAMES[0]);
  const [formThumb, setFormThumb] = useState('books');
  const [formFileName, setFormFileName] = useState('');
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>('draft');

  const filtered = templates.filter((t) => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (subjectFilter && t.subjectId !== subjectFilter) return false;
    if (statusFilter && t.status !== statusFilter) return false;
    return true;
  });

  const openAdd = () => {
    setEditingId(null);
    setFormName(''); setFormDesc(''); setFormSubject(SUBJECT_NAMES[0]); setFormThumb('books'); setFormFileName(''); setFormStatus('draft');
    setModalOpen(true);
  };

  const openEdit = (t: Template) => {
    setEditingId(t.id);
    setFormName(t.name); setFormDesc(t.description); setFormSubject(t.subjectId); setFormThumb(t.thumbnail); setFormFileName(t.fileName); setFormStatus(t.status);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) { toast('Vui lòng nhập tên template', 'error'); return; }
    if (editingId) {
      setTemplates((prev) => prev.map((t) => t.id === editingId ? { ...t, name: formName.trim(), description: formDesc.trim(), subjectId: formSubject, thumbnail: formThumb, fileName: formFileName.trim() || 'template.pptx', status: formStatus } : t));
      toast('Đã cập nhật template');
    } else {
      const newTpl: Template = { id: `t${++tplIdCounter}`, name: formName.trim(), description: formDesc.trim(), subjectId: formSubject, thumbnail: formThumb, fileName: formFileName.trim() || 'template.pptx', status: formStatus };
      setTemplates((prev) => [...prev, newTpl]);
      toast('Đã thêm template mới');
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Xóa template này?')) return;
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    toast('Đã xóa template', 'info');
  };

  return (
    <div className="page-container">
      <div className="page-toolbar"><AddButton onClick={openAdd}>Thêm template</AddButton></div>
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm template..." />
        <Select value={subjectFilter} onChange={setSubjectFilter} options={SUBJECT_NAMES.map((s) => ({ value: s, label: s }))} allLabel="Tất cả môn học" />
        <Select value={statusFilter} onChange={setStatusFilter} options={[{ value: 'draft', label: 'Nháp' }, { value: 'published', label: 'Đã xuất bản' }]} allLabel="Tất cả trạng thái" />
      </FilterBar>
      {filtered.length === 0 ? <EmptyState message="Không tìm thấy template nào." /> : (
        <div className="template-grid">
          {filtered.map((t) => (
            <div className="template-card" key={t.id}>
              <div className="template-thumb"><span className="template-thumb-icon">{THUMB_ICONS[t.thumbnail] || '📄'}</span></div>
              <div className="template-card-body">
                <div className="template-card-head">
                  <strong>{t.name}</strong>
                  <StatusBadge status={t.status} />
                </div>
                <span className="template-subject"><BookOpen size={12} /> {t.subjectId}</span>
                <p className="template-desc">{t.description}</p>
                <div className="template-file"><FileText size={13} /> {t.fileName}</div>
                <div className="template-actions">
                  <button className="row-action-btn" onClick={() => openEdit(t)}><Edit2 size={14} /> Sửa</button>
                  <button className="row-action-btn"><Download size={14} /> Tải</button>
                  <button className="row-action-btn danger" onClick={() => handleDelete(t.id)}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal
        title={editingId ? 'Sửa template' : 'Thêm template'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={<><Button variant="outline" onClick={() => setModalOpen(false)}>Hủy</Button><Button onClick={handleSave}>Lưu</Button></>}
      >
        <div className="form-group">
          <label className="form-label">Tên template</label>
          <input className="form-input" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nhập tên..." autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Mô tả</label>
          <textarea className="form-textarea" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Nhập mô tả..." rows={2} />
        </div>
        <div className="form-group">
          <label className="form-label">Môn học</label>
          <select className="form-input" value={formSubject} onChange={(e) => setFormSubject(e.target.value)}>
            {SUBJECT_NAMES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Thumbnail</label>
          <div className="thumb-picker">
            {Object.keys(THUMB_ICONS).map((key) => (
              <button key={key} className={`thumb-option ${formThumb === key ? 'selected' : ''}`} onClick={() => setFormThumb(key)}>
                <span>{THUMB_ICONS[key]}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Tên file template</label>
          <input className="form-input" value={formFileName} onChange={(e) => setFormFileName(e.target.value)} placeholder="VD: template.pptx" />
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
