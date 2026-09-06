import {
  BookText,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Lightbulb,
  ListChecks,
  PencilRuler,
  Presentation,
  Sigma,
  type LucideIcon,
} from 'lucide-react';
import type { Block, BlockType } from '../types';
import { BLOCK_LABELS } from '../store';

export const BLOCK_META: Record<BlockType, { icon: LucideIcon; color: string; label: string }> = {
  heading: { icon: BookText, color: 'violet', label: BLOCK_LABELS.heading },
  paragraph: { icon: FileText, color: 'slate', label: BLOCK_LABELS.paragraph },
  explanation: { icon: FileText, color: 'blue', label: BLOCK_LABELS.explanation },
  example: { icon: PencilRuler, color: 'orange', label: BLOCK_LABELS.example },
  formula: { icon: Sigma, color: 'teal', label: BLOCK_LABELS.formula },
  tip: { icon: Lightbulb, color: 'amber', label: BLOCK_LABELS.tip },
  image: { icon: ImageIcon, color: 'pink', label: BLOCK_LABELS.image },
  video: { icon: Presentation, color: 'rose', label: BLOCK_LABELS.video },
  slide: { icon: Presentation, color: 'indigo', label: BLOCK_LABELS.slide },
  quiz: { icon: HelpCircle, color: 'green', label: BLOCK_LABELS.quiz },
  exercise: { icon: ListChecks, color: 'cyan', label: BLOCK_LABELS.exercise },
  summary: { icon: BookText, color: 'violet', label: BLOCK_LABELS.summary },
};

export function BlockPreview({ block }: { block: Block }) {
  switch (block.type) {
    case 'heading':
      return <h2 className="pv-heading">{block.text || 'Tiêu đề'}</h2>;
    case 'paragraph':
    case 'explanation':
      return <p className="pv-paragraph">{block.text || ''}</p>;
    case 'example':
      return (
        <div className="pv-box pv-example">
          <span className="pv-box-label">Ví dụ</span>
          <p>{block.text || ''}</p>
        </div>
      );
    case 'formula':
      return (
        <div className="pv-box pv-formula">
          <span className="pv-box-label">Công thức</span>
          <p className="pv-formula-text">{block.text || ''}</p>
        </div>
      );
    case 'tip':
      return (
        <div className="pv-box pv-tip">
          <span className="pv-box-label">Mẹo nhớ</span>
          <p>{block.text || ''}</p>
        </div>
      );
    case 'image':
      return (
        <figure className="pv-image">
          {block.imageDataUrl ? (
            <img src={block.imageDataUrl} alt={block.imageCaption || block.imageFileName || ''} />
          ) : (
            <div className="pv-image-empty"><ImageIcon size={28} /><span>Chưa có hình ảnh</span></div>
          )}
          {block.imageCaption && <figcaption>{block.imageCaption}</figcaption>}
        </figure>
      );
    case 'video':
      return (
        <div className="pv-box pv-video">
          <span className="pv-box-label">Video</span>
          {block.videoUrl ? (
            <a href={block.videoUrl} target="_blank" rel="noreferrer" className="pv-link">{block.videoUrl}</a>
          ) : (
            <p className="pv-empty-text">Chưa có link video</p>
          )}
        </div>
      );
    case 'slide':
      return (
        <div className="pv-box pv-slide">
          <span className="pv-box-label">Slide bài giảng</span>
          {block.slideFileName ? (
            <div className="pv-slide-card">
              <div className={`pv-slide-icon ${block.slideFileType}`}>
                <FileText size={22} />
              </div>
              <div className="pv-slide-info">
                <strong>{block.slideFileName}</strong>
                <span>{block.slideFileType?.toUpperCase()} {block.slideFileSize ? `· ${block.slideFileSize}` : ''}</span>
              </div>
              <div className="pv-slide-actions">
                <button className="pv-slide-btn">Xem</button>
                <button className="pv-slide-btn primary">Tải xuống</button>
              </div>
            </div>
          ) : (
            <p className="pv-empty-text">Chưa có file slide</p>
          )}
        </div>
      );
    case 'quiz':
      return (
        <div className="pv-box pv-quiz">
          <span className="pv-box-label">Câu hỏi quiz</span>
          {block.quizItems && block.quizItems.length > 0 ? (
            <ol className="pv-quiz-list">
              {block.quizItems.map((q, i) => (
                <li key={q.id}>
                  <strong>Câu {i + 1}: {q.question || '(chưa nhập câu hỏi)'}</strong>
                  <span>Đáp án: {q.answer || '(chưa nhập đáp án)'}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="pv-empty-text">Chưa có câu hỏi</p>
          )}
        </div>
      );
    case 'exercise':
      return (
        <div className="pv-box pv-exercise">
          <span className="pv-box-label">Bài tập</span>
          <p>{block.text || ''}</p>
        </div>
      );
    case 'summary':
      return (
        <div className="pv-box pv-summary">
          <span className="pv-box-label">Tóm tắt</span>
          <p>{block.text || ''}</p>
        </div>
      );
    default:
      return null;
  }
}
