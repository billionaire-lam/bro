import { Edit2, Plus, Trash2, Send } from 'lucide-react';
import { useState } from 'react';
import type { Notification } from '../types';
import { mockNotifications } from '../mockData';
import { AddButton, Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { DataTable, EmptyState, FilterBar, SearchInput, Select, StatusBadge } from '../ui/PageComponents';
import { toast } from '../ui/Toast';

let notifIdCounter = 100;

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formAudience, setFormAudience] = useState<Notification['audience']>('Tất cả');
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>('draft');

  const filtered = notifications.filter((n) => {
    if (search && !n.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && n.status !== statusFilter) return false;
    return true;
  });

  const openAdd = () => {
    setEditingId(null);
    setFormTitle(''); setFormContent(''); setFormAudience('Tất cả'); setFormStatus('draft');
    setModalOpen(true);
  };

  const openEdit = (n: Notification) => {
    setEditingId(n.id);
    setFormTitle(n.title); setFormContent(n.content); setFormAudience(n.audience); setFormStatus(n.status);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formTitle.trim()) { toast('Vui lòng nhập tiêu đề', 'error'); return; }
    const today = new Date().toLocaleDateString('vi-VN');
    if (editingId) {
      setNotifications((prev) => prev.map((n) => n.id === editingId ? { ...n, title: formTitle.trim(), content: formContent.trim(), audience: formAudience, status: formStatus } : n));
      toast('Đã cập nhật thông báo');
    } else {
      const newN: Notification = { id: `n${++notifIdCounter}`, title: formTitle.trim(), content: formContent.trim(), audience: formAudience, date: today, status: formStatus };
      setNotifications((prev) => [newN, ...prev]);
      toast('Đã tạo thông báo mới');
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Xóa thông báo này?')) return;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast('Đã xóa thông báo', 'info');
  };

  const toggleStatus = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, status: n.status === 'draft' ? 'published' : 'draft' } : n));
    toast('Đã thay đổi trạng thái');
  };

  return (
    <div className="page-container">
      <div className="page-toolbar"><AddButton onClick={openAdd}>Tạo thông báo</AddButton></div>
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm thông báo..." />
        <Select value={statusFilter} onChange={setStatusFilter} options={[{ value: 'draft', label: 'Nháp' }, { value: 'published', label: 'Đã gửi' }]} allLabel="Tất cả trạng thái" />
      </FilterBar>
      {filtered.length === 0 ? <EmptyState message="Không tìm thấy thông báo nào." /> : (
        <DataTable headers={['Tiêu đề', 'Nội dung', 'Đối tượng', 'Ngày gửi', 'Trạng thái', '']}>
          {filtered.map((n) => (
            <tr key={n.id}>
              <td><strong>{n.title}</strong></td>
              <td className="cell-truncate">{n.content}</td>
              <td>{n.audience}</td>
              <td>{n.date}</td>
              <td>
                <button className="status-clickable" onClick={() => toggleStatus(n.id)}>
                  {n.status === 'published' ? <span className="status-badge published"><Send size={10} /> Đã gửi</span> : <StatusBadge status="draft" />}
                </button>
              </td>
              <td>
                <div className="row-actions">
                  <button className="row-action-btn" onClick={() => openEdit(n)}><Edit2 size={14} /> Sửa</button>
                  <button className="row-action-btn danger" onClick={() => handleDelete(n.id)}><Trash2 size={14} /></button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
      <Modal
        title={editingId ? 'Sửa thông báo' : 'Tạo thông báo'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={<><Button variant="outline" onClick={() => setModalOpen(false)}>Hủy</Button><Button onClick={handleSave}>Lưu</Button></>}
      >
        <div className="form-group">
          <label className="form-label">Tiêu đề</label>
          <input className="form-input" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Nhập tiêu đề..." autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Nội dung</label>
          <textarea className="form-textarea" value={formContent} onChange={(e) => setFormContent(e.target.value)} placeholder="Nhập nội dung..." rows={4} />
        </div>
        <div className="form-group">
          <label className="form-label">Đối tượng nhận</label>
          <select className="form-input" value={formAudience} onChange={(e) => setFormAudience(e.target.value as Notification['audience'])}>
            <option value="Tất cả">Tất cả</option>
            <option value="Học sinh">Học sinh</option>
            <option value="Giáo viên">Giáo viên</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Trạng thái</label>
          <div className="status-toggle">
            <button className={formStatus === 'draft' ? 'active' : ''} onClick={() => setFormStatus('draft')}>Nháp</button>
            <button className={formStatus === 'published' ? 'active' : ''} onClick={() => setFormStatus('published')}>Đã gửi</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
