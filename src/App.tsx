import {
  Activity,
  Bell,
  BookOpen,
  ChevronDown,
  ClipboardCheck,
  FileText,
  Home,
  LineChart,
  LogOut,
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
import { useAuth } from './auth';
import { useStore } from './store';
import { OverviewPage } from './pages/OverviewPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { LessonEditorPage } from './pages/LessonEditorPage';
import { LessonEditPage } from './pages/LessonEditPage';
import { LessonViewPage } from './pages/LessonViewPage';
import { LessonsPage } from './pages/LessonsPage';
import { QuizPage } from './pages/QuizPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { StudentsPage } from './pages/StudentsPage';
import { ProgressPage } from './pages/ProgressPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AIToolsPage } from './pages/AIToolsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ActivityLogPage } from './pages/ActivityLogPage';
import { LoginPage } from './pages/LoginPage';
import { ToastHost } from './ui/Toast';

type Role = 'student' | 'lecturer';

interface NavItem {
  label: string;
  icon: typeof Home;
  route: Route;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Tổng quan', icon: Home, route: { name: 'overview' }, roles: ['student', 'lecturer'] },
  { label: 'Môn học', icon: BookOpen, route: { name: 'subjects' }, roles: ['student', 'lecturer'] },
  { label: 'Bài giảng', icon: Presentation, route: { name: 'lessons' }, roles: ['student', 'lecturer'] },
  { label: 'Quiz', icon: ClipboardCheck, route: { name: 'quiz' }, roles: ['student', 'lecturer'] },
  { label: 'Template thuyết trình', icon: FileText, route: { name: 'templates' }, roles: ['lecturer'] },
  { label: 'Học sinh', icon: Users, route: { name: 'students' }, roles: ['lecturer'] },
  { label: 'Tiến độ học tập', icon: LineChart, route: { name: 'progress' }, roles: ['student', 'lecturer'] },
  { label: 'Thông báo', icon: Bell, route: { name: 'notifications' }, roles: ['student', 'lecturer'] },
  { label: 'AI Tools', icon: Sparkles, route: { name: 'ai-tools' }, roles: ['lecturer'] },
  { label: 'Cài đặt', icon: Settings, route: { name: 'settings' }, roles: ['student', 'lecturer'] },
  { label: 'Nhật ký hoạt động', icon: Activity, route: { name: 'activity-log' }, roles: ['lecturer'] },
];

const PAGE_TITLES: Record<string, string> = {
  overview: 'Tổng quan',
  subjects: 'Môn học',
  'lesson-editor': 'Soạn bài giảng',
  'lesson-edit': 'Chỉnh sửa bài giảng',
  'lesson-view': 'Bài giảng',
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

const LECTURER_ONLY = new Set(['templates', 'students', 'ai-tools', 'activity-log', 'lesson-editor', 'lesson-edit']);

function App() {
  const { user, profile, loading, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [route, setRoute] = useState<Route>({ name: 'overview' });
  const [searchQuery, setSearchQuery] = useState('');
  const { notifications } = useStore();
  const notifCount = notifications.filter((n) => n.status === 'published').length;

  const role: Role = profile?.role || 'student';

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <>
        <ToastHost />
        <LoginPage />
      </>
    );
  }

  const navigate = (r: Route) => {
    if (role === 'student' && LECTURER_ONLY.has(r.name)) {
      setRoute({ name: 'overview' });
      return;
    }
    setRoute(r);
    setSidebarOpen(false);
    setSearchQuery('');
  };

  const navigateByName = (name: string) => {
    const item = NAV_ITEMS.find((n) => n.route.name === name);
    if (item) navigate(item.route);
  };

  const visibleNav = NAV_ITEMS.filter((n) => n.roles.includes(role));
  const pageTitle = PAGE_TITLES[route.name] || 'Tổng quan';
  const activeNavLabel = route.name === 'lesson-editor' ? 'Môn học' : route.name === 'lesson-edit' || route.name === 'lesson-view' ? 'Bài giảng' : pageTitle;
  const initials = (profile.display_name || profile.email || '?').slice(0, 2).toUpperCase();

  const renderPage = () => {
    switch (route.name) {
      case 'overview':
        return <OverviewPage onNavigate={navigateByName} searchQuery={searchQuery} />;
      case 'subjects':
        return role === 'lecturer' ? (
          <SubjectsPage onOpenLesson={(sid, cid, lid) => navigate({ name: 'lesson-editor', subjectId: sid, chapterId: cid, lessonId: lid })} />
        ) : (
          <SubjectsPage onOpenLesson={(sid, cid, lid) => navigate({ name: 'lesson-view', subjectId: sid, chapterId: cid, lessonId: lid })} />
        );
      case 'lesson-editor':
        return role === 'lecturer' ? (
          <LessonEditorPage route={route} onBack={() => navigate({ name: 'subjects' })} />
        ) : (
          <OverviewPage onNavigate={navigateByName} searchQuery="" />
        );
      case 'lessons':
        return role === 'lecturer' ? (
          <LessonsPage onEditLesson={(sid, cid, lid) => navigate({ name: 'lesson-edit', subjectId: sid, chapterId: cid, lessonId: lid })} />
        ) : (
          <LessonsPage onEditLesson={(sid, cid, lid) => navigate({ name: 'lesson-view', subjectId: sid, chapterId: cid, lessonId: lid })} />
        );
      case 'lesson-edit':
        return role === 'lecturer' ? (
          <LessonEditPage route={route} onBack={() => navigate({ name: 'lessons' })} />
        ) : (
          <OverviewPage onNavigate={navigateByName} searchQuery="" />
        );
      case 'lesson-view':
        return <LessonViewPage route={route} onBack={() => navigate({ name: 'subjects' })} />;
      case 'quiz':
        return <QuizPage />;
      case 'templates':
        return role === 'lecturer' ? <TemplatesPage /> : <OverviewPage onNavigate={navigateByName} searchQuery="" />;
      case 'students':
        return role === 'lecturer' ? <StudentsPage /> : <OverviewPage onNavigate={navigateByName} searchQuery="" />;
      case 'progress':
        return <ProgressPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'ai-tools':
        return role === 'lecturer' ? <AIToolsPage /> : <OverviewPage onNavigate={navigateByName} searchQuery="" />;
      case 'settings':
        return <SettingsPage />;
      case 'activity-log':
        return role === 'lecturer' ? <ActivityLogPage /> : <OverviewPage onNavigate={navigateByName} searchQuery="" />;
      default:
        return <OverviewPage onNavigate={navigateByName} searchQuery={searchQuery} />;
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="app-shell">
      <ToastHost />
      {sidebarOpen && <button className="sidebar-overlay" aria-label="Đóng menu" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><span /></div>
          <span>StudyHub</span>
          <b>{role === 'lecturer' ? 'Giảng viên' : 'Học sinh'}</b>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Đóng menu"><X size={19} /></button>
        </div>
        <nav className="nav-list">
          {visibleNav.map(({ label, icon: Icon, route: itemRoute }) => {
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
        <div className="sidebar-bottom">
          <button className="profile-card" onClick={() => navigate({ name: 'settings' })}>
            <div className="profile-avatar">{initials}</div>
            <div><strong>{profile.display_name || profile.email}</strong><span>{role === 'lecturer' ? 'Giảng viên' : 'Học sinh'}</span></div>
            <ChevronDown size={15} />
          </button>
          <button className="sign-out-btn" onClick={handleSignOut} aria-label="Đăng xuất">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="menu-button" onClick={() => setSidebarOpen(true)} aria-label="Mở menu"><Menu size={20} /></button>
          <h1>{pageTitle}</h1>
          <div className="topbar-actions">
            <label className="search-box"><Search size={17} /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm kiếm..." aria-label="Tìm kiếm" /></label>
            <button className="notification-button" aria-label="Thông báo" onClick={() => navigate({ name: 'notifications' })}><Bell size={20} />{notifCount > 0 && <span>{notifCount}</span>}</button>
            <div className="top-avatar">{initials}</div>
          </div>
        </header>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
