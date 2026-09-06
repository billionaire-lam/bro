import { CheckCircle2, FileEdit, LogIn, Plus, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import type { ActivityLogEntry } from '../types';
import { useStore } from '../store';
import { DataTable, EmptyState, FilterBar, SearchInput, Select } from '../ui/PageComponents';

const TYPE_META: Record<ActivityLogEntry['type'], { label: string; color: string; icon: typeof CheckCircle2 }> = {
  create: { label: 'Tạo mới', color: 'green', icon: Plus },
  update: { label: 'Cập nhật', color: 'blue', icon: FileEdit },
  delete: { label: 'Xóa', color: 'red', icon: Trash2 },
  publish: { label: 'Xuất bản', color: 'violet', icon: Upload },
  login: { label: 'Đăng nhập', color: 'orange', icon: LogIn },
};

export function ActivityLogPage() {
  const { activityLog } = useStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');

  const filtered = activityLog.filter((e) => {
    if (search && !e.actor.toLowerCase().includes(search.toLowerCase()) && !e.action.toLowerCase().includes(search.toLowerCase()) && !e.target.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter && e.type !== typeFilter) return false;
    if (periodFilter === 'today' && !e.time.startsWith(new Date().toLocaleDateString('vi-VN'))) return false;
    if (periodFilter === 'week') {
      const entryDate = new Date(e.time.split(' ')[0].split('/').reverse().join('-'));
      const daysAgo = (Date.now() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysAgo > 7) return false;
    }
    if (periodFilter === 'month') {
      const entryDate = new Date(e.time.split(' ')[0].split('/').reverse().join('-'));
      const daysAgo = (Date.now() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysAgo > 30) return false;
    }
    return true;
  });

  return (
    <div className="page-container">
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo người, hành động..." />
        <Select value={typeFilter} onChange={setTypeFilter} options={Object.entries(TYPE_META).map(([value, meta]) => ({ value, label: meta.label }))} allLabel="Tất cả loại hành động" />
        <Select value={periodFilter} onChange={setPeriodFilter} options={[{ value: 'today', label: 'Hôm nay' }, { value: 'week', label: 'Tuần này' }, { value: 'month', label: 'Tháng này' }]} allLabel="Tất cả thời gian" />
      </FilterBar>
      {filtered.length === 0 ? <EmptyState message="Không tìm thấy hoạt động nào." /> : (
        <DataTable headers={['Người thực hiện', 'Hành động', 'Nội dung liên quan', 'Loại', 'Thời gian']}>
          {filtered.map((e) => {
            const meta = TYPE_META[e.type];
            const Icon = meta.icon;
            return (
              <tr key={e.id}>
                <td><strong>{e.actor}</strong></td>
                <td>{e.action}</td>
                <td>{e.target || '—'}</td>
                <td><span className={`type-badge ${meta.color}`}><Icon size={12} /> {meta.label}</span></td>
                <td>{e.time}</td>
              </tr>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}
