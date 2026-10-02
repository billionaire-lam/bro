import {
  BookText,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Lightbulb,
  ListChecks,
  PencilRuler,
  Play,
  Presentation,
  Sigma,
  StickyNote,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
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
  video: { icon: Play, color: 'rose', label: BLOCK_LABELS.video },
  slide: { icon: Presentation, color: 'indigo', label: BLOCK_LABELS.slide },
  question: { icon: HelpCircle, color: 'green', label: BLOCK_LABELS.question },
  exercise: { icon: ListChecks, color: 'cyan', label: BLOCK_LABELS.exercise },
  quiz: { icon: HelpCircle, color: 'green', label: BLOCK_LABELS.quiz },
  summary: { icon: StickyNote, color: 'violet', label: BLOCK_LABELS.summary },
};

function renderRichText(text: string | undefined): React.ReactNode {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let keyIdx = 0;
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const italicMatch = remaining.match(/\*(.+?)\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) parts.push(remaining.slice(0, boldMatch.index));
        parts.push(<strong key={`b${i}-${keyIdx++}`}>{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      } else if (italicMatch && italicMatch.index !== undefined) {
        if (italicMatch.index > 0) parts.push(remaining.slice(0, italicMatch.index));
        parts.push(<em key={`i${i}-${keyIdx++}`}>{italicMatch[1]}</em>);
        remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
      } else {
        parts.push(remaining);
        break;
      }
    }
    const isBullet = line.startsWith('- ') || line.startsWith('* ');
    const isNumbered = /^\d+\.\s/.test(line);
    if (isBullet) return <li key={i} className="pv-list-item pv-bullet">{parts}</li>;
    if (isNumbered) return <li key={i} className="pv-list-item pv-numbered">{parts}</li>;
    return <p key={i} className="pv-text-line">{parts}</p>;
  });
}

function getYoutubeEmbed(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  return null;
}

function isPdf(url: string): boolean {
  return url.toLowerCase().endsWith('.pdf') || url.includes('application/pdf');
}

export function BlockPreview({ block }: { block: Block }) {
  const [showExplanation, setShowExplanation] = useState(false);

  switch (block.type) {
    case 'heading':
      return <h2 className="pv-heading">{block.text || 'Tiêu đề'}</h2>;
    case 'paragraph':
    case 'explanation':
      return <div className="pv-paragraph">{renderRichText(block.text)}</div>;
    case 'example':
      return (
        <div className="pv-box pv-example">
          <span className="pv-box-label">Ví dụ</span>
          <div className="pv-box-content">{renderRichText(block.text)}</div>
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
          <div className="pv-box-content">{renderRichText(block.text)}</div>
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
    case 'video': {
      const url = block.videoUrl || '';
      const embed = getYoutubeEmbed(url);
      return (
        <div className="pv-box pv-video">
          <span className="pv-box-label">Video</span>
          {url ? (
            embed ? (
              <div className="pv-video-embed">
                <iframe src={embed} title="Video bài giảng" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            ) : (
              <video controls className="pv-video-native" preload="metadata">
                <source src={url} />
                Trình duyệt không hỗ trợ phát video.
              </video>
            )
          ) : (
            <p className="pv-empty-text">Chưa có link video</p>
          )}
        </div>
      );
    }
    case 'slide': {
      const url = block.slideUrl || '';
      const isPdfSlide = isPdf(url);
      return (
        <div className="pv-box pv-slide">
          <span className="pv-box-label">Slide bài giảng</span>
          {url ? (
            isPdfSlide ? (
              <div className="pv-slide-viewer">
                <object data={url} type="application/pdf" className="pv-pdf-embed">
                  <p>Không thể hiển thị PDF. <a href={url} target="_blank" rel="noreferrer">Mở trong tab mới</a></p>
                </object>
              </div>
            ) : (
              <div className="pv-slide-card">
                <div className={`pv-slide-icon ${block.slideFileType || 'pptx'}`}>
                  <FileText size={22} />
                </div>
                <div className="pv-slide-info">
                  <strong>{block.slideFileName || url}</strong>
                  <span>{(block.slideFileType || '').toUpperCase()} {block.slideFileSize ? `· ${block.slideFileSize}` : ''}</span>
                </div>
                <div className="pv-slide-actions">
                  <a href={url} target="_blank" rel="noreferrer" className="pv-slide-btn"><ExternalLink size={14} /> Xem</a>
                  <a href={url} download className="pv-slide-btn primary"><Download size={14} /> Tải xuống</a>
                </div>
              </div>
            )
          ) : block.slideFileName ? (
            <div className="pv-slide-card">
              <div className={`pv-slide-icon ${block.slideFileType || 'pptx'}`}>
                <FileText size={22} />
              </div>
              <div className="pv-slide-info">
                <strong>{block.slideFileName}</strong>
                <span>{(block.slideFileType || '').toUpperCase()} {block.slideFileSize ? `· ${block.slideFileSize}` : ''}</span>
              </div>
            </div>
          ) : (
            <p className="pv-empty-text">Chưa có slide</p>
          )}
          {block.slideCaption && <p className="pv-slide-caption">{block.slideCaption}</p>}
        </div>
      );
    }
    case 'question': {
      return (
        <div className="pv-box pv-question">
          <span className="pv-box-label">Câu hỏi</span>
          <p className="pv-question-text">{block.questionText || '(chưa nhập câu hỏi)'}</p>
          {block.questionChoices && block.questionChoices.length > 0 && (
            <ul className="pv-choices">
              {block.questionChoices.map((c, i) => (
                <li key={c.id} className={c.correct ? 'pv-choice-correct' : ''}>
                  <span className="pv-choice-letter">{String.fromCharCode(65 + i)}</span>
                  <span className="pv-choice-text">{c.text || '(chưa nhập)'}</span>
                  {c.correct && <span className="pv-choice-check">✓</span>}
                </li>
              ))}
            </ul>
          )}
          {block.questionExplanation && (
            <div className="pv-explanation-toggle">
              <button onClick={() => setShowExplanation(!showExplanation)}>
                {showExplanation ? 'Ẩn lời giải' : 'Xem lời giải'}
              </button>
              {showExplanation && <p>{block.questionExplanation}</p>}
            </div>
          )}
        </div>
      );
    }
    case 'exercise': {
      return (
        <div className="pv-box pv-exercise">
          <span className="pv-box-label">Bài tập</span>
          <p className="pv-exercise-text">{block.exerciseQuestion || '(chưa nhập bài tập)'}</p>
          <div className="pv-exercise-answer">
            <label>Đáp án ({block.exerciseAnswerType === 'number' ? 'số' : 'chữ'}):</label>
            <span className="pv-exercise-value">{block.exerciseAnswer || '(chưa nhập)'}</span>
          </div>
          {block.exerciseExplanation && (
            <div className="pv-exercise-explanation">
              <span>Lời giải:</span>
              <p>{block.exerciseExplanation}</p>
            </div>
          )}
        </div>
      );
    }
    case 'quiz': {
      return (
        <div className="pv-box pv-quiz">
          <span className="pv-box-label">Quiz</span>
          {block.quizItems && block.quizItems.length > 0 ? (
            <ol className="pv-quiz-list">
              {block.quizItems.map((q, i) => (
                <li key={q.id}>
                  <strong>Câu {i + 1}: {q.question || '(chưa nhập câu hỏi)'}</strong>
                  {q.choices && q.choices.length > 0 && (
                    <ul className="pv-quiz-choices">
                      {q.choices.map((c, ci) => (
                        <li key={c.id} className={c.correct ? 'pv-choice-correct' : ''}>
                          <span className="pv-choice-letter">{String.fromCharCode(65 + ci)}</span>
                          <span>{c.text || '(chưa nhập)'}</span>
                          {c.correct && <span className="pv-choice-check">✓</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                  {q.explanation && <p className="pv-quiz-explanation">Giải thích: {q.explanation}</p>}
                </li>
              ))}
            </ol>
          ) : (
            <p className="pv-empty-text">Chưa có câu hỏi</p>
          )}
        </div>
      );
    }
    case 'summary': {
      return (
        <div className="pv-box pv-summary">
          <span className="pv-box-label">📌 Cần nhớ</span>
          {block.summaryItems && block.summaryItems.filter((s) => s.trim()).length > 0 ? (
            <ul className="pv-summary-list">
              {block.summaryItems.filter((s) => s.trim()).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="pv-empty-text">Chưa có nội dung tóm tắt</p>
          )}
        </div>
      );
    }
    default:
      return null;
  }
}
