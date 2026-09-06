import { Eye, Flame } from 'lucide-react';
import { useState } from 'react';
import type { Student } from '../types';
import { useStore } from '../store';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { DataTable, EmptyState, FilterBar, SearchInput, Select } from '../ui/PageComponents';

export function StudentsPage() {
  const { students } = useStore();
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);

  const subjectNames = Array.from(new Set(students.map((s) => s.subject)));

  const filtered = students.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (subjectFilter && s.subject !== subjectFilter) return false;
    if (statusFilter && s.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="page-container">
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên hoặc email..." />
        <Select value={subjectFilter} onChange={setSubjectFilter} options={subjectNames.map((s) => ({ value: s, label: s }))} allLabel="Tất cả môn học" />
        <Select value={statusFilter} onChange={setStatusFilter} options={[{ value: 'active', label: 'Đang hoạt động' }, { value: 'inactive', label: 'Không hoạt động' }]} allLabel="Tất cả trạng thái" />
      </FilterBar>
      {filtered.length === 0 ? <EmptyState message="Không tìm thấy học sinh nào." /> : (
        <DataTable headers={['Tên', 'Email', 'Môn đang học', 'Tiến độ', 'Streak', 'Trạng thái', 'Ngày tham gia', '']}>
          {filtered.map((s) => (
            <tr key={s.id}>
              <td><strong>{s.name}</strong></td>
              <td>{s.email}</td>
              <td>{s.subject}</td>
              <td>
                <div className="progress-cell">
                  <div className="progress-bar-mini"><span style={{ width: `${s.progress}%` }} /></div>
                  <span>{s.progress}%</span>
                </div>
              </td>
              <td><span className="streak-badge"><Flame size={12} /> {s.streak}</span></td>
              <td><span className={`status-badge ${s.status === 'active' ? 'published' : 'draft'}`}>{s.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}</span></td>
              <td>{s.joinDate}</td>
              <td><button className="row-action-btn" onClick={() => setDetailStudent(s)}><Eye size={14} /> Chi tiết</button></td>
            </tr>
          ))}
        </DataTable>
      )}
      <Modal
        title={detailStudent ? detailStudent.name : ''}
        open={!!detailStudent}
        onClose={() => setDetailStudent(null)}
        footer={<Button onClick={() => setDetailStudent(null)}>Đóng</Button>}
      >
        {detailStudent && (
          <div className="student-detail">
            <div className="student-detail-head">
              <div className="student-avatar-lg">{detailStudent.name.split(' ').slice(-1)[0][0]}</div>
              <div>
                <strong>{detailStudent.name}</strong>
                <span>{detailStudent.email}</span>
              </div>
            </div>
            <div className="student-stats">
              <div className="student-stat"><span>Môn đang học</span><strong>{detailStudent.subject}</strong></div>
              <div className="student-stat"><span>Tiến độ</span><strong>{detailStudent.progress}%</strong></div>
              <div className="student-stat"><span>Streak</span><strong>{detailStudent.streak} ngày</strong></div>
              <div className="student-stat"><span>Ngày tham gia</span><strong>{detailStudent.joinDate}</strong></div>
            </div>
            <h4>Hoạt động gần đây</h4>
            <div className="student-activity">
              {detailStudent.recentActivity.map((a, i) => (
                <div className="student-activity-row" key={i}>
                  <span className="student-activity-dot" />
                  <div><strong>{a.action}</strong><span>{a.time}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
