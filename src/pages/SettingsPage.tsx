import { Save } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { toast } from '../ui/Toast';

export function SettingsPage() {
  const [siteName, setSiteName] = useState('StudyHub');
  const [siteDesc, setSiteDesc] = useState('Nền tảng học tập trực tuyến cho học sinh');
  const [accentColor, setAccentColor] = useState('violet');
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [autoPublish, setAutoPublish] = useState(false);
  const [defaultDuration, setDefaultDuration] = useState('20');
  const [maxUpload, setMaxUpload] = useState('50');
  const [language, setLanguage] = useState('vi');
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');

  const handleSave = () => {
    toast('Đã lưu thay đổi cài đặt');
  };

  return (
    <div className="page-container">
      <div className="settings-sections">
        <section className="panel settings-section">
          <h2>Thông tin StudyHub</h2>
          <div className="form-group">
            <label className="form-label">Tên nền tảng</label>
            <input className="form-input" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Mô tả</label>
            <textarea className="form-textarea" value={siteDesc} onChange={(e) => setSiteDesc(e.target.value)} rows={2} />
          </div>
        </section>

        <section className="panel settings-section">
          <h2>Cấu hình giao diện</h2>
          <div className="form-group">
            <label className="form-label">Màu chủ đạo</label>
            <div className="color-picker">
              {(['violet', 'blue', 'green', 'orange', 'pink'] as const).map((c) => (
                <button key={c} className={`color-option ${c} ${accentColor === c ? 'selected' : ''}`} onClick={() => setAccentColor(c)} />
              ))}
            </div>
          </div>
          <div className="settings-toggle-row">
            <div><strong>Chế độ tối</strong><span>Bật giao diện nền tối</span></div>
            <button className={`toggle-switch ${darkMode ? 'on' : ''}`} onClick={() => setDarkMode(!darkMode)}><span /></button>
          </div>
        </section>

        <section className="panel settings-section">
          <h2>Thông báo</h2>
          <div className="settings-toggle-row">
            <div><strong>Email thông báo</strong><span>Gửi email khi có hoạt động mới</span></div>
            <button className={`toggle-switch ${emailNotif ? 'on' : ''}`} onClick={() => setEmailNotif(!emailNotif)}><span /></button>
          </div>
          <div className="settings-toggle-row">
            <div><strong>Push notification</strong><span>Thông báo đẩy trên trình duyệt</span></div>
            <button className={`toggle-switch ${pushNotif ? 'on' : ''}`} onClick={() => setPushNotif(!pushNotif)}><span /></button>
          </div>
          <div className="settings-toggle-row">
            <div><strong>Báo cáo tuần</strong><span>Gửi báo cáo tổng hợp mỗi tuần</span></div>
            <button className={`toggle-switch ${weeklyReport ? 'on' : ''}`} onClick={() => setWeeklyReport(!weeklyReport)}><span /></button>
          </div>
        </section>

        <section className="panel settings-section">
          <h2>Cài đặt nội dung</h2>
          <div className="form-group">
            <label className="form-label">Thời lượng bài giảng mặc định (phút)</label>
            <input className="form-input" type="number" value={defaultDuration} onChange={(e) => setDefaultDuration(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Dung lượng upload tối đa (MB)</label>
            <input className="form-input" type="number" value={maxUpload} onChange={(e) => setMaxUpload(e.target.value)} />
          </div>
          <div className="settings-toggle-row">
            <div><strong>Tự động xuất bản</strong><span>Xuất bản bài giảng ngay khi tạo</span></div>
            <button className={`toggle-switch ${autoPublish ? 'on' : ''}`} onClick={() => setAutoPublish(!autoPublish)}><span /></button>
          </div>
        </section>

        <section className="panel settings-section">
          <h2>Cài đặt hệ thống</h2>
          <div className="form-group">
            <label className="form-label">Ngôn ngữ</label>
            <select className="form-input" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Múi giờ</label>
            <select className="form-input" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
              <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
              <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
            </select>
          </div>
        </section>

        <div className="settings-save-bar">
          <Button onClick={handleSave}><Save size={16} /> Lưu thay đổi</Button>
        </div>
      </div>
    </div>
  );
}
