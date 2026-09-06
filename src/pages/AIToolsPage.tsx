import { BookOpen, ClipboardCheck, HelpCircle, Lightbulb, Sparkles, Wand2, FileText, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { toast } from '../ui/Toast';

const TOOLS = [
  { id: 'create-lesson', label: 'AI tạo bài giảng', desc: 'Tạo cấu trúc bài giảng từ chủ đề', icon: BookOpen, color: 'violet' },
  { id: 'create-quiz', label: 'AI tạo Quiz', desc: 'Sinh câu hỏi trắc nghiệm tự động', icon: ClipboardCheck, color: 'green' },
  { id: 'explain', label: 'AI giải thích bài học', desc: 'Giải thích khái niệm dễ hiểu', icon: Lightbulb, color: 'orange' },
  { id: 'questions', label: 'AI tạo câu hỏi', desc: 'Tạo câu hỏi thảo luận cho bài học', icon: HelpCircle, color: 'blue' },
  { id: 'summary', label: 'AI tóm tắt bài học', desc: 'Tóm tắt nội dung bài giảng', icon: FileText, color: 'pink' },
];

const MOCK_RESULTS: Record<string, (input: string) => string> = {
  'create-lesson': (input) => `Bài giảng: ${input}\n\n1. Mục tiêu bài học\n2. Khái niệm cơ bản\n3. Ví dụ minh họa\n4. Bài tập thực hành\n5. Tóm tắt\n\nThời lượng dự kiến: 25 phút`,
  'create-quiz': (input) => `Quiz: ${input}\n\nCâu 1: Khái niệm cơ bản về "${input}"?\n  A. Đáp án A  B. Đáp án B  C. Đáp án C  D. Đáp án D\n  Đáp án đúng: A\n\nCâu 2: Ứng dụng của "${input}"?\n  A. Đáp án A  B. Đáp án B  C. Đáp án C  D. Đáp án D\n  Đáp án đúng: B`,
  'explain': (input) => `"${input}" là một khái niệm quan trọng.\n\nGiải thích đơn giản: ${input} có thể hiểu là quá trình hoặc hiện tượng mà trong đó các yếu tố liên quan tương tác với nhau để tạo ra kết quả nhất định.\n\nVí dụ: Khi áp dụng vào thực tế, ${input} giúp chúng ta hiểu rõ hơn về cách hệ thống hoạt động.`,
  'questions': (input) => `Câu hỏi thảo luận về "${input}":\n\n1. Tại sao ${input} lại quan trọng?\n2. Em có thể tìm thấy ${input} trong đời sống hàng ngày ở đâu?\n3. So sánh ${input} với khái niệm tương tự.\n4. Nêu ưu nhược điểm của ${input}.\n5. Em sẽ ứng dụng ${input} như thế nào?`,
  'summary': (input) => `Tóm tắt bài học: ${input}\n\n• Điểm chính 1: Khái niệm và định nghĩa\n• Điểm chính 2: Tính chất và đặc điểm\n• Điểm chính 3: Ứng dụng thực tế\n• Điểm chính 4: Lưu ý quan trọng\n\nKết luận: ${input} là nội dung nền tảng cần nắm vững.`,
};

export function AIToolsPage() {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const tool = TOOLS.find((t) => t.id === activeTool);

  const handleGenerate = () => {
    if (!input.trim()) { toast('Vui lòng nhập yêu cầu', 'error'); return; }
    setLoading(true);
    setResult('');
    setTimeout(() => {
      setResult(MOCK_RESULTS[activeTool!]?.(input.trim()) || 'Kết quả mock');
      setLoading(false);
    }, 800);
  };

  const openTool = (id: string) => {
    setActiveTool(id);
    setInput('');
    setResult('');
  };

  const closeTool = () => {
    setActiveTool(null);
    setInput('');
    setResult('');
  };

  if (tool) {
    const Icon = tool.icon;
    return (
      <div className="page-container">
        <div className="ai-tool-header">
          <Button variant="ghost" size="sm" onClick={closeTool}><X size={15} /> Quay lại</Button>
          <div className="ai-tool-title">
            <span className={`ai-tool-icon ${tool.color}`}><Icon size={20} /></span>
            <div><strong>{tool.label}</strong><span>{tool.desc}</span></div>
          </div>
        </div>
        <div className="ai-tool-body">
          <div className="ai-tool-input">
            <label className="form-label">Nhập yêu cầu của bạn</label>
            <textarea className="form-textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder="VD: Tạo bài giảng về phân thức đại số cho học sinh lớp 8..." rows={4} />
            <Button onClick={handleGenerate} disabled={loading}><Wand2 size={15} /> {loading ? 'Đang tạo...' : 'Tạo nội dung'}</Button>
          </div>
          {result && (
            <div className="ai-tool-result">
              <div className="ai-tool-result-head"><Sparkles size={15} /> Kết quả</div>
              <pre className="ai-tool-result-text">{result}</pre>
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard?.writeText(result); toast('Đã sao chép'); }}>Sao chép</Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="ai-tools-grid">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          return (
            <button className="ai-tool-card" key={t.id} onClick={() => openTool(t.id)}>
              <span className={`ai-tool-icon ${t.color}`}><Icon size={24} /></span>
              <strong>{t.label}</strong>
              <span>{t.desc}</span>
              <span className="ai-tool-go">Sử dụng →</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
