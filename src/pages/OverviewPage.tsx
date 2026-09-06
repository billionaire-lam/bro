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

const stats = [
  { label: 'Tổng học sinh', value: '1,248', detail: '+142 so với tuần trước', icon: Users, color: 'violet', points: '0,25 10,25 20,23 30,23 40,18 50,25 60,14 70,18 80,7 90,13 100,3' },
  { label: 'Tổng bài giảng', value: '326', detail: '+18 so với tuần trước', icon: BookOpen, color: 'teal', points: '0,25 15,25 25,22 35,23 45,15 55,22 65,18 75,21 85,10 94,16 100,8' },
  { label: 'Quiz', value: '712', detail: '+56 so với tuần trước', icon: ClipboardCheck, color: 'orange', points: '0,25 15,25 25,23 35,15 45,19 55,11 65,20 75,13 82,0 92,10 100,1' },
  { label: 'Học sinh hoạt động', value: '842', detail: '67.6% tổng số học sinh', icon: Users, color: 'blue', points: '0,12 22,22 33,22 43,16 54,22 63,17 72,23 82,8 90,16 100,4' },
];

const activities = [
  { name: 'Nguyễn Minh đã tạo bài giảng mới', sub: 'Bài 12: Phân thức đại số', time: '10:30 AM', icon: BookOpen, color: 'violet' },
  { name: 'Trần Gia Bảo đã hoàn thành quiz', sub: 'Quiz: Hàm số bậc nhất', time: '09:15 AM', icon: ClipboardCheck, color: 'teal' },
  { name: 'Lê Khánh Linh đã đăng bài thuyết trình', sub: 'Template: Giới thiệu sách', time: '08:45 AM', icon: Presentation, color: 'orange' },
  { name: 'Phạm Hoàng Nam đã tham gia khóa học', sub: 'Toán 8 - Chương 3', time: 'Hôm qua', icon: Users, color: 'blue' },
  { name: 'Đặng Thu Hà đã gửi câu hỏi cho AI', sub: 'Hàm số bậc hai', time: 'Hôm qua', icon: Bot, color: 'pink' },
];

const content = [
  ['Bài giảng', 'Bài 12: Phân thức đại số', 'Toán 8 - Chương 1', 'Đã xuất bản', '18/05/2024', 'green'],
  ['Bài giảng', 'Bài 11: Quy đồng mẫu thức', 'Toán 8 - Chương 1', 'Đã xuất bản', '17/05/2024', 'green'],
  ['Quiz', 'Quiz: Hàm số bậc nhất', 'Toán 9 - Chương 2', 'Bản nháp', '16/05/2024', 'yellow'],
  ['Template', 'Giới thiệu sách', 'Ngữ văn 8', 'Đã xuất bản', '15/05/2024', 'green'],
  ['Bài giảng', 'Unit 5: Natural wonders', 'Tiếng Anh 8', 'Đã xuất bản', '15/05/2024', 'green'],
] as const;

const subjects = [
  { name: 'Toán 8', value: 78, color: 'violet' },
  { name: 'Ngữ văn 8', value: 65, color: 'green' },
  { name: 'Tiếng Anh 8', value: 82, color: 'blue' },
  { name: 'Lịch sử 8', value: 54, color: 'orange' },
  { name: 'Khoa học tự nhiên 8', value: 47, color: 'pink' },
];

function Trend({ points, color }: { points: string; color: string }) {
  return (
    <svg className={`trend trend-${color}`} viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.7" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function ActivityChart() {
  const chartPoints = '0,104 16.6,70 33.2,59 49.8,31 66.4,41 83,50 100,31';
  const areaPoints = `${chartPoints} 100,136 0,136`;
  return (
    <div className="chart-wrap">
      <div className="chart-y-axis"><span>1,000</span><span>800</span><span>600</span><span>400</span><span>200</span><span>0</span></div>
      <div className="chart-area">
        <svg viewBox="0 0 100 136" preserveAspectRatio="none" className="activity-chart" role="img" aria-label="Biểu đồ hoạt động học sinh trong 7 ngày">
          <defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#7155ef" stopOpacity=".16" /><stop offset="100%" stopColor="#7155ef" stopOpacity=".01" /></linearGradient></defs>
          {[0, 27.2, 54.4, 81.6, 108.8, 136].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} className="grid-line" />)}
          <polygon points={areaPoints} fill="url(#chart-fill)" />
          <polyline points={chartPoints} fill="none" stroke="#7155ef" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
          {chartPoints.split(' ').map((point) => { const [cx, cy] = point.split(','); return <circle key={point} cx={cx} cy={cy} r="2" fill="#7155ef" stroke="white" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />; })}
        </svg>
        <div className="chart-x-axis">{['12/05', '13/05', '14/05', '15/05', '16/05', '17/05', '18/05'].map((day) => <span key={day}>{day}</span>)}</div>
      </div>
    </div>
  );
}

interface OverviewProps {
  onNavigate: (route: string) => void;
  searchQuery: string;
}

export function OverviewPage({ onNavigate, searchQuery }: OverviewProps) {
  const statRoutes: Record<string, string> = {
    'Tổng học sinh': 'students',
    'Tổng bài giảng': 'lessons',
    'Quiz': 'quiz',
    'Học sinh hoạt động': 'students',
  };

  const filteredContent = searchQuery
    ? content.filter(([, title, subject]) => title.toLowerCase().includes(searchQuery.toLowerCase()) || subject.toLowerCase().includes(searchQuery.toLowerCase()))
    : content;

  const filteredActivities = searchQuery
    ? activities.filter((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.sub.toLowerCase().includes(searchQuery.toLowerCase()))
    : activities;

  return (
    <div className="dashboard">
      <section className="stats-grid">
        {stats.map(({ label, value, detail, icon: Icon, color, points }) => (
          <article className="stat-card clickable" key={label} onClick={() => onNavigate(statRoutes[label])}>
            <div className={`stat-icon ${color}`}><Icon size={22} /></div>
            <div className="stat-copy"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
            <Trend points={points} color={color} />
          </article>
        ))}
      </section>
      <section className="dashboard-grid">
        <div className="left-column">
          <article className="panel chart-panel">
            <div className="panel-heading"><div><h2>Thống kê học sinh <span>(7 ngày qua)</span></h2></div><button className="select-button">7 ngày qua <ChevronDown size={15} /></button></div>
            <ActivityChart />
          </article>
          <article className="panel content-panel">
            <div className="panel-heading"><h2>Nội dung mới nhất</h2><button className="outline-button" onClick={() => onNavigate('lessons')}>Xem tất cả</button></div>
            <div className="content-table">
              <div className="table-head"><span>Loại</span><span>Tên nội dung</span><span>Môn học</span><span>Trạng thái</span><span>Ngày tạo</span></div>
              {filteredContent.map(([type, title, subject, status, date, tone]) => (
                <div className="content-row" key={title}>
                  <span><em className={`type-pill ${type === 'Quiz' ? 'quiz' : type === 'Template' ? 'template' : ''}`}>{type}</em></span>
                  <strong>{title}</strong>
                  <span>{subject}</span>
                  <span><em className={`status-pill ${tone}`}>{status}</em></span>
                  <span>{date}</span>
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
                <div className="activity-row" key={name}>
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
              {subjects.map(({ name, value, color }) => (
                <div className="progress-row" key={name}><strong>{name}</strong><div className="progress-track"><span className={color} style={{ width: `${value}%` }} /></div><b>{value}%</b></div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

export { Bell };
