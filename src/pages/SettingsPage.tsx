import { Bell, Clock, Mail, Moon, Palette, Save, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { toast } from '../ui/Toast';
import { supabase } from '../supabaseClient';

interface NotifPrefs {
  email_notifications_enabled: boolean;
  push_notifications_enabled: boolean;
  daily_reminder_enabled: boolean;
  daily_reminder_time: string;
  weekly_report_enabled: boolean;
  timezone: string;
  theme_primary: string;
  theme_secondary: string;
}

const DEFAULT_PREFS: NotifPrefs = {
  email_notifications_enabled: true,
  push_notifications_enabled: false,
  daily_reminder_enabled: false,
  daily_reminder_time: '19:00',
  weekly_report_enabled: false,
  timezone: 'Asia/Ho_Chi_Minh',
  theme_primary: 'black',
  theme_secondary: 'white',
};

export function SettingsPage() {
  const { profile, user } = useAuth();
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingReminderValue, setPendingReminderValue] = useState(false);
  const [pushBlocked, setPushBlocked] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) { setLoadingPrefs(false); return; }
      if (data) {
        setPrefs({
          email_notifications_enabled: data.email_notifications_enabled,
          push_notifications_enabled: data.push_notifications_enabled,
          daily_reminder_enabled: data.daily_reminder_enabled,
          daily_reminder_time: data.daily_reminder_time || '19:00',
          weekly_report_enabled: data.weekly_report_enabled,
          timezone: data.timezone || 'Asia/Ho_Chi_Minh',
          theme_primary: data.theme_primary || 'black',
          theme_secondary: data.theme_secondary || 'white',
        });
      }
      setLoadingPrefs(false);
    })();
  }, [user]);

  useEffect(() => {
    if (prefs.theme_primary === 'white') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, [prefs.theme_primary]);

  const savePrefs = async (updated: Partial<NotifPrefs>) => {
    if (!user) return;
    const next = { ...prefs, ...updated };
    setPrefs(next);
    setSaving(true);
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: user.id, ...next });
    setSaving(false);
    if (error) {
      toast('Lỗi khi lưu cài đặt', 'error');
    }
  };

  const handleThemeChange = (theme: string) => {
    savePrefs({ theme_primary: theme });
    toast('Đã đổi giao diện');
  };

  const toggleEmail = () => savePrefs({ email_notifications_enabled: !prefs.email_notifications_enabled });
  const toggleWeekly = () => savePrefs({ weekly_report_enabled: !prefs.weekly_report_enabled });

  const togglePush = async () => {
    if (!prefs.push_notifications_enabled) {
      // Turning ON — request browser permission
      if (!('Notification' in window)) {
        toast('Trình duyệt không hỗ trợ thông báo đẩy', 'error');
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPushBlocked(false);
        savePrefs({ push_notifications_enabled: true });
        toast('Đã bật thông báo đẩy');
      } else if (permission === 'denied') {
        setPushBlocked(true);
        toast('Bạn đã chặn thông báo trên trình duyệt', 'error');
      }
    } else {
      savePrefs({ push_notifications_enabled: false });
    }
  };

  const toggleDailyReminder = () => {
    if (!prefs.daily_reminder_enabled) {
      // Turning ON — show confirmation modal
      setPendingReminderValue(true);
      setShowConfirm(true);
    } else {
      // Turning OFF — just save
      savePrefs({ daily_reminder_enabled: false });
      toast('Đã tắt lời nhắc học');
    }
  };

  const confirmReminder = () => {
    savePrefs({ daily_reminder_enabled: true });
    setShowConfirm(false);
    setPendingReminderValue(false);
    toast('Đã bật lời nhắc học mỗi ngày');
  };

  const cancelReminder = () => {
    setShowConfirm(false);
    setPendingReminderValue(false);
  };

  const handleReminderTime = (time: string) => {
    savePrefs({ daily_reminder_time: time });
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', user.id);
    if (error) toast('Lỗi khi lưu', 'error');
    else toast('Đã lưu thông tin cá nhân');
  };

  if (loadingPrefs) {
    return <div className="page-container"><div className="empty-hint">Đang tải cài đặt...</div></div>;
  }

  return (
    <div className="page-container">
      <div className="settings-sections">
        <section className="panel settings-section">
          <h2>Thông tin cá nhân</h2>
          <div className="form-group">
            <label className="form-label">Tên hiển thị</label>
            <input className="form-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Tên của bạn" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" value={profile?.email || ''} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Vai trò</label>
            <div className="role-display">
              <span className={`role-badge ${profile?.role}`}>{profile?.role === 'lecturer' ? 'Giảng viên' : 'Học sinh'}</span>
            </div>
          </div>
          <div className="settings-save-bar">
            <Button onClick={handleSaveProfile}><Save size={16} /> Lưu thông tin</Button>
          </div>
        </section>

        <section className="panel settings-section">
          <h2><Palette size={18} /> Giao diện</h2>
          <div className="form-group">
            <label className="form-label">Màu chủ đạo</label>
            <div className="theme-picker">
              <button
                className={`theme-option dark ${prefs.theme_primary === 'black' ? 'selected' : ''}`}
                onClick={() => handleThemeChange('black')}
              >
                <Moon size={18} />
                <span>Giao diện tối</span>
              </button>
              <button
                className={`theme-option light ${prefs.theme_primary === 'white' ? 'selected' : ''}`}
                onClick={() => handleThemeChange('white')}
              >
                <Sun size={18} />
                <span>Giao diện sáng</span>
              </button>
            </div>
          </div>
        </section>

        <section className="panel settings-section">
          <h2><Bell size={18} /> Thông báo</h2>
          <div className="settings-toggle-row">
            <div><strong><Mail size={14} /> Email thông báo</strong><span>Gửi email khi có hoạt động mới</span></div>
            <button className={`toggle-switch ${prefs.email_notifications_enabled ? 'on' : ''}`} onClick={toggleEmail}><span /></button>
          </div>
          <div className="settings-toggle-row">
            <div><strong>Push notification</strong><span>Thông báo đẩy trên trình duyệt</span></div>
            <button className={`toggle-switch ${prefs.push_notifications_enabled ? 'on' : ''}`} onClick={togglePush}><span /></button>
          </div>
          {pushBlocked && (
            <p className="settings-warning">Bạn đã chặn thông báo trên trình duyệt. Hãy bật quyền thông báo trong cài đặt trình duyệt để sử dụng tính năng này.</p>
          )}
          <div className="settings-toggle-row">
            <div><strong><Clock size={14} /> Nhắc học mỗi ngày</strong><span>Nhận lời nhắc học tập mỗi ngày</span></div>
            <button className={`toggle-switch ${prefs.daily_reminder_enabled ? 'on' : ''}`} onClick={toggleDailyReminder}><span /></button>
          </div>
          {prefs.daily_reminder_enabled && (
            <div className="settings-sub-row">
              <label className="form-label">Thời gian nhắc</label>
              <input
                type="time"
                className="form-input time-input"
                value={prefs.daily_reminder_time}
                onChange={(e) => handleReminderTime(e.target.value)}
              />
            </div>
          )}
          <div className="settings-toggle-row">
            <div><strong>Báo cáo tuần</strong><span>Gửi báo cáo tổng hợp mỗi tuần</span></div>
            <button className={`toggle-switch ${prefs.weekly_report_enabled ? 'on' : ''}`} onClick={toggleWeekly}><span /></button>
          </div>
        </section>

        <section className="panel settings-section">
          <h2>Cài đặt hệ thống</h2>
          <div className="form-group">
            <label className="form-label">Múi giờ</label>
            <select
              className="form-input"
              value={prefs.timezone}
              onChange={(e) => savePrefs({ timezone: e.target.value })}
            >
              <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
              <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
              <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
              <option value="UTC">UTC (GMT+0)</option>
            </select>
          </div>
        </section>
      </div>

      {saving && <div className="settings-saving-indicator">Đang lưu...</div>}

      <Modal
        title="Bạn chắc chưa?"
        open={showConfirm}
        onClose={cancelReminder}
        footer={
          <>
            <Button variant="outline" onClick={cancelReminder}>Hủy</Button>
            <Button onClick={confirmReminder}>Tôi chắc chắn</Button>
          </>
        }
      >
        <div className="confirm-reminder-body">
          <Clock size={32} className="confirm-reminder-icon" />
          <p>StudyHub sẽ gửi cho bạn lời nhắc học mỗi ngày vào <strong>{prefs.daily_reminder_time}</strong>.</p>
          <p className="confirm-reminder-sub">Bạn có thể thay đổi hoặc tắt lời nhắc này bất cứ lúc nào.</p>
        </div>
      </Modal>
    </div>
  );
}
