import { BookOpen, Check, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../auth';
import { toast } from '../ui/Toast';

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Quá yếu', 'Yếu', 'Trung bình', 'Khá tốt', 'Mạnh', 'Rất mạnh'];
  const colors = ['#f25961', '#f25961', '#f0a020', '#f0c020', '#39ac62', '#2b9a5f'];
  return { score, label: labels[score], color: colors[score] };
}

function passwordRequirements(pw: string): { label: string; met: boolean }[] {
  return [
    { label: 'Ít nhất 8 ký tự', met: pw.length >= 8 },
    { label: 'Có chữ viết hoa', met: /[A-Z]/.test(pw) },
    { label: 'Có ký tự đặc biệt', met: /[^A-Za-z0-9]/.test(pw) },
  ];
}

export function LoginPage() {
  const { signIn, signUp, signInWithGoogle, signInWithFacebook } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const pwStrength = passwordStrength(password);
  const pwReqs = passwordRequirements(password);

  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setError(null);
    setSuccessMsg(null);
    setPassword('');
    setConfirmPassword('');
  };

  const validateSignup = (): string | null => {
    if (!displayName.trim()) return 'Vui lòng nhập tên hiển thị';
    if (displayName.trim().length < 2) return 'Tên hiển thị phải có ít nhất 2 ký tự';
    if (!email.trim()) return 'Vui lòng nhập email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Email không hợp lệ';
    if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
    if (!/[A-Z]/.test(password)) return 'Mật khẩu phải có ít nhất 1 chữ viết hoa';
    if (!/[^A-Za-z0-9]/.test(password)) return 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt';
    if (password !== confirmPassword) return 'Mật khẩu xác nhận không khớp';
    return null;
  };

  const validateLogin = (): string | null => {
    if (!email.trim() || !password.trim()) return 'Vui lòng nhập email và mật khẩu';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const validationError = mode === 'login' ? validateLogin() : validateSignup();
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    if (mode === 'login') {
      const { error: err } = await signIn(email.trim(), password);
      if (err) setError(err);
    } else {
      const { error: err, needsLogin } = await signUp(email.trim(), password, displayName.trim());
      if (err) {
        setError(err);
      } else if (needsLogin) {
        setSuccessMsg('Tài khoản đã được tạo. Vui lòng đăng nhập để tiếp tục.');
        switchMode('login');
        setPassword('');
        setConfirmPassword('');
        setDisplayName('');
        toast('Tài khoản đã được tạo thành công');
      } else {
        toast('Tài khoản đã được tạo');
      }
    }
    setBusy(false);
  };

  const handleGoogle = async () => {
    setError(null);
    setSuccessMsg(null);
    setBusy(true);
    const { error: err } = await signInWithGoogle();
    if (err) { setError(err); setBusy(false); }
  };

  const handleFacebook = async () => {
    setError(null);
    setSuccessMsg(null);
    setBusy(true);
    const { error: err } = await signInWithFacebook();
    if (err) { setError(err); setBusy(false); }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-mark"><BookOpen size={28} /></div>
          <h1>StudyHub</h1>
          <p>{mode === 'login' ? 'Đăng nhập để tiếp tục học tập' : 'Tạo tài khoản để bắt đầu học tập'}</p>
        </div>

        {error && <div className="login-error">{error}</div>}
        {successMsg && <div className="login-success"><Check size={16} /> {successMsg}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          {mode === 'signup' && (
            <div className="login-field">
              <label>Tên hiển thị</label>
              <div className="login-input-wrap">
                <User size={17} className="login-input-icon" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  autoComplete="name"
                  autoFocus
                />
              </div>
            </div>
          )}
          <div className="login-field">
            <label>Email</label>
            <div className="login-input-wrap">
              <Mail size={17} className="login-input-icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                autoComplete="email"
                autoFocus={mode === 'login'}
              />
            </div>
          </div>
          <div className="login-field">
            <label>Mật khẩu</label>
            <div className="login-input-wrap">
              <Lock size={17} className="login-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button type="button" className="login-eye" onClick={() => setShowPassword(!showPassword)} aria-label="Hiện mật khẩu">
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {mode === 'signup' && password.length > 0 && (
              <>
                <div className="pw-strength">
                  <div className="pw-strength-bar">
                    <div className="pw-strength-fill" style={{ width: `${(pwStrength.score / 5) * 100}%`, background: pwStrength.color }} />
                  </div>
                  <span className="pw-strength-label" style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                </div>
                <ul className="pw-reqs">
                  {pwReqs.map((req) => (
                    <li key={req.label} className={req.met ? 'met' : ''}>
                      <span className="pw-req-check">{req.met ? <Check size={12} /> : <span className="pw-req-dot" />}</span>
                      {req.label}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          {mode === 'signup' && (
            <div className="login-field">
              <label>Xác nhận mật khẩu</label>
              <div className="login-input-wrap">
                <Lock size={17} className="login-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                {confirmPassword.length > 0 && password === confirmPassword && (
                  <Check size={17} className="login-input-check" />
                )}
              </div>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <span className="pw-mismatch">Mật khẩu không khớp</span>
              )}
            </div>
          )}

          {mode === 'login' && (
            <button type="button" className="login-forgot" onClick={() => toast('Vui lòng liên hệ quản trị viên để đặt lại mật khẩu', 'info')}>
              Quên mật khẩu?
            </button>
          )}

          <button type="submit" className="login-submit" disabled={busy}>
            {busy ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </form>

        <div className="login-divider"><span>hoặc</span></div>

        <button className="login-oauth google" onClick={handleGoogle} disabled={busy}>
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          <span>Continue with Google</span>
        </button>
        <button className="login-oauth facebook" onClick={handleFacebook} disabled={busy}>
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#1877F2" d="M24 12c0-6.63-5.37-12-12-12S0 5.37 0 12c0 5.99 4.39 10.95 10.13 11.85v-8.38H7.08V12h3.05V9.36c0-3 1.8-4.66 4.53-4.66 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.96.93-1.96 1.87V12h3.33l-.53 3.47h-2.8v8.38C19.61 22.95 24 17.99 24 12z"/></svg>
          <span>Continue with Facebook</span>
        </button>

        <div className="login-switch">
          {mode === 'login' ? (
            <>Chưa có tài khoản? <button type="button" onClick={() => switchMode('signup')}>Đăng ký</button></>
          ) : (
            <>Đã có tài khoản? <button type="button" onClick={() => switchMode('login')}>Đăng nhập</button></>
          )}
        </div>

        <div className="login-role-hint">
          {mode === 'login' ? (
            <p>Tài khoản mới đăng ký mặc định là <strong>Học sinh</strong>. Quyền <strong>Giảng viên</strong> do quản trị cấp.</p>
          ) : (
            <p>Bạn đăng ký với tư cách <strong>Học sinh</strong>. Muốn trở thành Giảng viên, vui lòng liên hệ quản trị.</p>
          )}
        </div>
      </div>
    </div>
  );
}
