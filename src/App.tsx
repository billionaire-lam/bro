import {
  Activity,
  Bell,
  BookOpen,
  ChevronDown,
  ClipboardCheck,
  FileText,
  Home,
  LineChart,
  Menu,
  Moon,
  Presentation,
  Search,
  Settings,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { Route } from './types';
import { useStore } from './store';
import { OverviewPage } from './pages/OverviewPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { LessonEditorPage } from './pages/LessonEditorPage';
import { LessonEditPage } from './pages/LessonEditPage';
import { LessonsPage } from './pages/LessonsPage';
import { QuizPage } from './pages/QuizPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { StudentsPage } from './pages/StudentsPage';
import { ProgressPage } from './pages/ProgressPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AIToolsPage } from './pages/AIToolsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ActivityLogPage } from './pages/ActivityLogPage';
import { ToastHost } from './ui/Toast';

const NAV_ITEMS = [
  { label: 'Tổng quan', icon: Home, route: { name: 'overview' } as Route },
  { label: 'Môn học', icon: BookOpen, route: { name: 'subjects' } as Route },
  { label: 'Bài giảng', icon: Presentation, route: { name: 'lessons' } as Route },
  { label: 'Quiz', icon: ClipboardCheck, route: { name: 'quiz' } as Route },
  { label: 'Template thuyết trình', icon: FileText, route: { name: 'templates' } as Route },
  { label: 'Học sinh', icon: Users, route: { name: 'students' } as Route },
  { label: 'Tiến độ học tập', icon: LineChart, route: { name: 'progress' } as Route },
  { label: 'Thông báo', icon: Bell, route: { name: 'notifications' } as Route },
  { label: 'AI Tools', icon: Sparkles, route: { name: 'ai-tools' } as Route },
  { label: 'Cài đặt', icon: Settings, route: { name: 'settings' } as Route },
  { label: 'Nhật ký hoạt động', icon: Activity, route: { name: 'activity-log' } as Route },
];

const PAGE_TITLES: Record<string, string> = {
  overview: 'Tổng quan',
  subjects: 'Môn học',
  'lesson-editor': 'Soạn bài giảng',
  'lesson-edit': 'Chỉnh sửa bài giảng',
  lessons: 'Bài giảng',
  quiz: 'Quiz',
  templates: 'Template thuyết trình',
  students: 'Học sinh',
  progress: 'Tiến độ học tập',
  notifications: 'Thông báo',
  'ai-tools': 'AI Tools',
  settings: 'Cài đặt',
  'activity-log': 'Nhật ký hoạt động',
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [route, setRoute] = useState<Route>({ name: 'overview' });
  const [searchQuery, setSearchQuery] = useState('');
  const { notifications } = useStore();
  const notifCount = notifications.filter((n) => n.status === 'published').length;

  const pageTitle = PAGE_TITLES[route.name] || 'Tổng quan';
  const activeNavLabel = route.name === 'lesson-editor' ? 'Môn học' : route.name === 'lesson-edit' ? 'Bài giảng' : pageTitle;

  const navigate = (r: Route) => {
    setRoute(r);
    setSidebarOpen(false);
    setSearchQuery('');
  };

  const navigateByName = (name: string) => {
    const item = NAV_ITEMS.find((n) => n.route.name === name);
    if (item) navigate(item.route);
  };

  const renderPage = () => {
    switch (route.name) {
      case 'overview':
        return <OverviewPage onNavigate={navigateByName} searchQuery={searchQuery} />;
      case 'subjects':
        return <SubjectsPage onOpenLesson={(sid, cid, lid) => navigate({ name: 'lesson-editor', subjectId: sid, chapterId: cid, lessonId: lid })} />;
      case 'lesson-editor':
        return <LessonEditorPage route={route} onBack={() => navigate({ name: 'subjects' })} />;
      case 'lessons':
        return <LessonsPage onEditLesson={(sid, cid, lid) => navigate({ name: 'lesson-edit', subjectId: sid, chapterId: cid, lessonId: lid })} />;
      case 'lesson-edit':
        return <LessonEditPage route={route} onBack={() => navigate({ name: 'lessons' })} />;
      case 'quiz':
        return <QuizPage />;
      case 'templates':
        return <TemplatesPage />;
      case 'students':
        return <StudentsPage />;
      case 'progress':
        return <ProgressPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'ai-tools':
        return <AIToolsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'activity-log':
        return <ActivityLogPage />;
      default:
        return <OverviewPage onNavigate={navigateByName} searchQuery={searchQuery} />;
    }
  };

  return (
    <div className="app-shell">
      <ToastHost />
      {sidebarOpen && <button className="sidebar-overlay" aria-label="Đóng menu" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><span /></div>
          <span>StudyHub</span>
          <b>Admin</b>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Đóng menu"><X size={19} /></button>
        </div>
        <nav className="nav-list">
          {NAV_ITEMS.map(({ label, icon: Icon, route: itemRoute }) => {
            const active = label === activeNavLabel;
            return (
              <button
                key={label}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => navigate(itemRoute)}
              >
                <Icon size={19} strokeWidth={active ? 2.3 : 1.8} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
        <button className="profile-card" onClick={() => navigate({ name: 'settings' })}>
          <div className="profile-avatar">NM</div>
          <div><strong>Nguyễn Minh</strong><span>Quản trị viên</span></div>
          <ChevronDown size={15} />
        </button>
        <button className="dark-mode" aria-label="Cài đặt giao diện" onClick={() => navigate({ name: 'settings' })}><Moon size={18} /></button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="menu-button" onClick={() => setSidebarOpen(true)} aria-label="Mở menu"><Menu size={20} /></button>
          <h1>{pageTitle}</h1>
          <div className="topbar-actions">
            <label className="search-box"><Search size={17} /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm kiếm..." aria-label="Tìm kiếm" /></label>
            <button className="notification-button" aria-label="Thông báo" onClick={() => navigate({ name: 'notifications' })}><Bell size={20} />{notifCount > 0 && <span>{notifCount}</span>}</button>
            <div className="top-avatar">NM</div>
          </div>
        </header>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
