import { useState } from 'react';
import { SUBJECT_NAMES } from '../mockData';
import { FilterBar, Select } from '../ui/PageComponents';

const SUBJECT_PROGRESS = SUBJECT_NAMES.map((name, i) => ({
  name,
  avgProgress: [78, 65, 82, 54, 47][i],
  students: [320, 210, 280, 180, 258][i],
  completed: [248, 136, 229, 97, 121][i],
}));

const CHART_POINTS = '0,120 20,80 40,90 60,50 80,60 100,30 120,45 140,20';

export function ProgressPage() {
  const [subjectFilter, setSubjectFilter] = useState('');
  const [period, setPeriod] = useState('7');

  const totalStudents = SUBJECT_PROGRESS.reduce((s, p) => s + p.students, 0);
  const avgProgress = Math.round(SUBJECT_PROGRESS.reduce((s, p) => s + p.avgProgress, 0) / SUBJECT_PROGRESS.length);
  const completed = SUBJECT_PROGRESS.reduce((s, p) => s + p.completed, 0);

  const displayData = subjectFilter ? SUBJECT_PROGRESS.filter((p) => p.name === subjectFilter) : SUBJECT_PROGRESS;

  return (
    <div className="page-container">
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-icon violet"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /></svg></div><div className="stat-copy"><span>Tổng học sinh</span><strong>{totalStudents.toLocaleString()}</strong><small>Đang theo học</small></div></div>
        <div className="stat-card"><div className="stat-icon blue"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg></div><div className="stat-copy"><span>Tiến độ TB</span><strong>{avgProgress}%</strong><small>Toàn hệ thống</small></div></div>
        <div className="stat-card"><div className="stat-icon orange"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 14s1.5 2 4 2 4-2 4-2" /><path d="M9 9h.01" /><path d="M15 9h.01" /><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" /></svg></div><div className="stat-copy"><span>Streak TB</span><strong>9 ngày</strong><small>Liên tục học</small></div></div>
        <div className="stat-card"><div className="stat-icon teal"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg></div><div className="stat-copy"><span>Hoàn thành BG</span><strong>{completed}</strong><small>Bài giảng</small></div></div>
      </div>

      <FilterBar>
        <Select value={subjectFilter} onChange={setSubjectFilter} options={SUBJECT_NAMES.map((s) => ({ value: s, label: s }))} allLabel="Tất cả môn học" />
        <Select value={period} onChange={setPeriod} options={[{ value: '7', label: '7 ngày qua' }, { value: '30', label: '30 ngày qua' }, { value: '90', label: '90 ngày qua' }]} allLabel="" />
      </FilterBar>

      <div className="panel" style={{ marginTop: '18px' }}>
        <div className="panel-heading"><h2>Biểu đồ tiến độ <span>(7 ngày qua)</span></h2></div>
        <div className="chart-wrap" style={{ height: '200px' }}>
          <div className="chart-y-axis"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div>
          <div className="chart-area">
            <svg viewBox="0 0 140 130" preserveAspectRatio="none" className="activity-chart">
              <defs><linearGradient id="prog-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#398ced" stopOpacity=".18" /><stop offset="100%" stopColor="#398ced" stopOpacity=".01" /></linearGradient></defs>
              {[0, 26, 52, 78, 104, 130].map((y) => <line key={y} x1="0" x2="140" y1={y} y2={y} className="grid-line" />)}
              <polygon points={`${CHART_POINTS} 140,130 0,130`} fill="url(#prog-fill)" />
              <polyline points={CHART_POINTS} fill="none" stroke="#398ced" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: '16px' }}>
        <div className="panel-heading"><h2>Tiến độ theo môn</h2></div>
        <div className="data-table-wrap" style={{ marginTop: '14px' }}>
          <table className="data-table">
            <thead><tr><th>Môn học</th><th>Số học sinh</th><th>Bài đã hoàn thành</th><th>Tiến độ TB</th></tr></thead>
            <tbody>
              {displayData.map((p) => (
                <tr key={p.name}>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.students}</td>
                  <td>{p.completed}</td>
                  <td>
                    <div className="progress-cell">
                      <div className="progress-bar-mini"><span style={{ width: `${p.avgProgress}%` }} /></div>
                      <span>{p.avgProgress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
