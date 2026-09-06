import {
  Bell,
  BookOpen,
  Bot,
  ChevronDown,
  ClipboardCheck,
  LineChart,
  Presentation,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { countAllLessons, useStore } from '../store';

interface StatConfig {
  label: string;
  icon: typeof Users;
  color: string;
  points: string;
  route: string;
}

const STAT_CONFIGS: StatConfig[] = [
  { label: 'Tổng học sinh', icon: Users, color: 'violet', points: '0,25 10,25 20,23 30,23 40,18 50,25 60,14 70,18 80,7 90,13 100,3', route: 'students' },
  { label: 'Tổng bài giảng', icon: BookOpen, color: 'teal', points: '0,25 15,25 25,22 35,23 45,15 55,22 65,18 75,21 85,10 94,16 100,8', route: 'lessons' },
  { label: 'Quiz', icon: ClipboardCheck, color: 'orange', points: '0,25 15,25 25,23 35,15 45,19 55,11 65,20 75,13 82,0 92,10 100,1', route: 'quiz' },
  { label: 'Học sinh hoạt động', icon: Users, color: 'blue', points: '0,12 22,22 33,22 43,16 54,22 63,17 72,23 82,8 90,16 100,4', route: 'students' },
];

const CHART_PERIODS: Record<string, { points: string; labels: string[]; yMax: string; ySteps: string[] }> = {
  '7': { points: '0,104 16.6,70 33.2,59 49.8,31 66.4,41 83,50 100,31', labels: ['12/05', '13/05', '14/05', '15/05', '16/05', '17/05', '18/05'], yMax: '1,000', ySteps: ['1,000', '800', '600', '400', '200', '0'] },
  '30': { points: '0,90 14,78 28,82 42,55 56,60 70,38 84,45 100,25', labels: ['19/05', '22/05', '25/05', '28/05', '31/05', '03/06', '07/06', '11/06'], yMax: '1,200', ySteps: ['1,200', '960', '720', '480', '240', '0'] },
  '90': { points: '0,110 20,95 40,70 55,75 70,45 85,55 100,30', labels: ['19/05', '09/06', '29/06', '19/07', '08/08', '28/08', '17/09'], yMax: '1,500', ySteps: ['1,500', '1,200', '900', '600', '300', '0'] },
};

function Trend({ points, color }: { points: string; color: string }) {
  return (
    <svg className={`trend trend-${color}`} viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.7" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

interface OverviewProps {
  onNavigate: (route: string) => void;
  searchQuery: string;
}

export function OverviewPage({ onNavigate, searchQuery }: OverviewProps) {
  const { data, quizzes, students, activityLog } = useStore();
  const [chartPeriod, setChartPeriod] = useState('7');
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);

  const totalStudents = students.length;
  const totalLessons = countAllLessons(data);
  const totalQuizzes = quizzes.length;
  const activeStudents = students.filter((s) => s.status === 'active').length;

  const stats = [
    { ...STAT_CONFIGS[0], value: totalStudents.toLocaleString(), detail: `${activeStudents} đang hoạt động` },
    { ...STAT_CONFIGS[1], value: String(totalLessons), detail: `${data.length} môn học` },
    { ...STAT_CONFIGS[2], value: String(totalQuizzes), detail: `${quizzes.filter((q) => q.status === 'published').length} đã xuất bản` },
    { ...STAT_CONFIGS[3], value: String(activeStudents), detail: `${Math.round((activeStudents / Math.max(totalStudents, 1)) * 100)}% tổng số học sinh` },
  ];

  const recentContent = useMemo(() => {
    const items: { type: string; title: string; subject: string; status: string; date: string; tone: string }[] = [];
    data.forEach((s) => {
      s.chapters.forEach((c) => {
        c.lessons.forEach((l) => {
          items.push({ type: 'Bài giảng', title: l.name, subject: `${s.name} - ${c.name}`, status: l.status === 'published' ? 'Đã xuất bản' : 'Bản nháp', date: '18/05/2024', tone: l.status === 'published' ? 'green' : 'yellow' });
        });
      });
    });
    quizzes.forEach((q) => {
      items.push({ type: 'Quiz', title: q.name, subject: q.subjectId, status: q.status === 'published' ? 'Đã xuất bản' : 'Bản nháp', date: '16/05/2024', tone: q.status === 'published' ? 'green' : 'yellow' });
    });
    return items.slice(0, 6);
  }, [data, quizzes]);

  const recentActivities = useMemo(() => {
    return activityLog.slice(0, 5).map((a) => {
      const iconMap: Record<string, typeof BookOpen> = { create: BookOpen, update: Presentation, delete: ClipboardCheck, publish: Presentation, login: Users };
      const colorMap: Record<string, string> = { create: 'violet', update: 'teal', delete: 'orange', publish: 'blue', login: 'pink' };
      return { name: `${a.actor} đã ${a.action.toLowerCase()}`, sub: a.target, time: a.time.split(' ').slice(-1)[0], icon: iconMap[a.type] || Bot, color: colorMap[a.type] || 'violet' };
    });
  }, [activityLog]);

  const filteredContent = searchQuery
    ? recentContent.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.subject.toLowerCase().includes(searchQuery.toLowerCase()))
    : recentContent;

  const filteredActivities = searchQuery
    ? recentActivities.filter((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.sub.toLowerCase().includes(searchQuery.toLowerCase()))
    : recentActivities;

  const period = CHART_PERIODS[chartPeriod];
  const areaPoints = `${period.points} 100,136 0,136`;

  return (
    <div className="dashboard">
      <section className="stats-grid">
        {stats.map(({ label, value, detail, icon: Icon, color, points, route }) => (
          <article className="stat-card clickable" key={label} onClick={() => onNavigate(route)}>
            <div className={`stat-icon ${color}`}><Icon size={22} /></div>
            <div className="stat-copy"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
            <Trend points={points} color={color} />
          </article>
        ))}
      </section>
      <section className="dashboard-grid">
        <div className="left-column">
          <article className="panel chart-panel">
            <div className="panel-heading">
              <div><h2>Thống kê học sinh <span>({chartPeriod} ngày qua)</span></h2></div>
              <div className="select-wrapper">
                <button className="select-button" onClick={() => setPeriodMenuOpen(!periodMenuOpen)}>
                  {chartPeriod} ngày qua <ChevronDown size={15} />
                </button>
                {periodMenuOpen && (
                  <div className="select-dropdown">
                    {Object.keys(CHART_PERIODS).map((p) => (
                      <button key={p} className={`select-option ${chartPeriod === p ? 'active' : ''}`} onClick={() => { setChartPeriod(p); setPeriodMenuOpen(false); }}>
                        {p} ngày qua
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="chart-wrap">
              <div className="chart-y-axis">{period.ySteps.map((y) => <span key={y}>{y}</span>)}</div>
              <div className="chart-area">
                <svg viewBox="0 0 100 136" preserveAspectRatio="none" className="activity-chart" role="img" aria-label="Biểu đồ hoạt động học sinh">
                  <defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#7155ef" stopOpacity=".16" /><stop offset="100%" stopColor="#7155ef" stopOpacity=".01" /></linearGradient></defs>
                  {[0, 27.2, 54.4, 81.6, 108.8, 136].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} className="grid-line" />)}
                  <polygon points={areaPoints} fill="url(#chart-fill)" />
                  <polyline points={period.points} fill="none" stroke="#7155ef" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
                  {period.points.split(' ').map((point) => { const [cx, cy] = point.split(','); return <circle key={point} cx={cx} cy={cy} r="2" fill="#7155ef" stroke="white" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />; })}
                </svg>
                <div className="chart-x-axis">{period.labels.map((day) => <span key={day}>{day}</span>)}</div>
              </div>
            </div>
          </article>
          <article className="panel content-panel">
            <div className="panel-heading"><h2>Nội dung mới nhất</h2><button className="outline-button" onClick={() => onNavigate('lessons')}>Xem tất cả</button></div>
            <div className="content-table">
              <div className="table-head"><span>Loại</span><span>Tên nội dung</span><span>Môn học</span><span>Trạng thái</span><span>Ngày tạo</span></div>
              {filteredContent.map((c) => (
                <div className="content-row" key={c.title}>
                  <span><em className={`type-pill ${c.type === 'Quiz' ? 'quiz' : c.type === 'Template' ? 'template' : ''}`}>{c.type}</em></span>
                  <strong>{c.title}</strong>
                  <span>{c.subject}</span>
                  <span><em className={`status-pill ${c.tone}`}>{c.status}</em></span>
                  <span>{c.date}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
        <div className="right-column">
          <article className="panel activity-panel">
            <div className="panel-heading"><h2>Hoạt động gần đây</h2><button className="outline-button" onClick={() => onNavigate('activity-log')}>Xem tất cả</button></div>
            <div className="activity-list">
              {filteredActivities.map(({ name, sub, time, icon: Icon, color }) => (
                <div className="activity-row" key={name + time}>
                  <div className={`activity-icon ${color}`}><Icon size={17} /></div>
                  <div className="activity-copy"><strong>{name}</strong><span>{sub}</span></div>
                  <time>{time}</time>
                </div>
              ))}
            </div>
          </article>
          <article className="panel progress-panel">
            <div className="panel-heading"><h2>Tiến độ học tập trung bình</h2><button className="outline-button" onClick={() => onNavigate('progress')}>Xem chi tiết</button></div>
            <div className="progress-list">
              {students.reduce<{ name: string; value: number; count: number }[]>((acc, s) => {
                const existing = acc.find((a) => a.name === s.subject);
                if (existing) { existing.value += s.progress; existing.count += 1; }
                else acc.push({ name: s.subject, value: s.progress, count: 1 });
                return acc;
              }, []).map(({ name, value, count }) => {
                const avg = Math.round(value / count);
                const colorMap: Record<string, string> = { 'Toán 8': 'violet', 'Ngữ văn 8': 'green', 'Tiếng Anh 8': 'blue', 'Lịch sử 8': 'orange', 'Khoa học tự nhiên 8': 'pink' };
                return (
                  <div className="progress-row" key={name}><strong>{name}</strong><div className="progress-track"><span className={colorMap[name] || 'violet'} style={{ width: `${avg}%` }} /></div><b>{avg}%</b></div>
                );
              })}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

export { Bell };
