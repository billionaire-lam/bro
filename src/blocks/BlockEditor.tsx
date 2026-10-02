import {
  ArrowDown,
  ArrowUp,
  Bold,
  Copy,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useRef, type ChangeEvent } from 'react';
import type { Block, QuizChoice } from '../types';
import { BLOCK_LABELS, createBlock, genId } from '../store';
import { BLOCK_META } from './BlockPreview';

interface BlockEditorProps {
  block: Block;
  onChange: (block: Block) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
}

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function insertAtCursor(textarea: HTMLTextAreaElement, insertText: string): string {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const before = value.slice(0, start);
  const after = value.slice(end);
  return before + insertText + after;
}

export function BlockEditor({
  block,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  canMoveUp,
  canMoveDown,
  onDragStart,
  onDragEnter,
  onDragEnd,
  isDragging,
  isDragOver,
}: BlockEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const slideInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const meta = BLOCK_META[block.type];
  const Icon = meta.icon;

  const update = (patch: Partial<Block>) => onChange({ ...block, ...patch });

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      alert('Định dạng không hỗ trợ. Vui lòng chọn file PNG, JPG, JPEG hoặc WEBP.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      update({ imageDataUrl: reader.result as string, imageFileName: file.name });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSlideSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    let fileType: 'pptx' | 'pdf' | null = null;
    if (ext === 'pptx' || file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      fileType = 'pptx';
    } else if (ext === 'pdf' || file.type === 'application/pdf') {
      fileType = 'pdf';
    }
    if (!fileType) {
      alert('Định dạng không hỗ trợ. Vui lòng chọn file .pptx hoặc .pdf.');
      return;
    }
    update({
      slideFileName: file.name,
      slideFileType: fileType,
      slideFileSize: formatBytes(file.size),
    });
    e.target.value = '';
  };

  const handleFormat = (format: 'bold' | 'italic' | 'bullet' | 'numbered') => {
    const ta = textAreaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.slice(start, end);
    let newText: string;
    let newCursorStart: number;
    let newCursorEnd: number;

    if (format === 'bold') {
      newText = insertAtCursor(ta, `**${selected || 'chữ đậm'}**`);
      newCursorStart = start + 2;
      newCursorEnd = newCursorStart + (selected || 'chữ đậm').length;
    } else if (format === 'italic') {
      newText = insertAtCursor(ta, `*${selected || 'chữ nghiêng'}*`);
      newCursorStart = start + 1;
      newCursorEnd = newCursorStart + (selected || 'chữ nghiêng').length;
    } else if (format === 'bullet') {
      const lineStart = ta.value.lastIndexOf('\n', start - 1) + 1;
      const before = ta.value.slice(0, lineStart);
      const after = ta.value.slice(lineStart);
      newText = before + '- ' + after;
      newCursorStart = start + 2;
      newCursorEnd = end + 2;
    } else {
      const lineStart = ta.value.lastIndexOf('\n', start - 1) + 1;
      const before = ta.value.slice(0, lineStart);
      const after = ta.value.slice(lineStart);
      newText = before + '1. ' + after;
      newCursorStart = start + 3;
      newCursorEnd = end + 3;
    }

    update({ text: newText });
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(newCursorStart, newCursorEnd);
    });
  };

  const renderTextEditor = (placeholder: string, rows: number) => (
    <div className="block-text-editor">
      {(block.type === 'paragraph' || block.type === 'explanation' || block.type === 'example' || block.type === 'tip' || block.type === 'exercise') && (
        <div className="block-format-toolbar">
          <button type="button" onClick={() => handleFormat('bold')} title="Đậm"><Bold size={14} /></button>
          <button type="button" onClick={() => handleFormat('italic')} title="Nghiêng"><Italic size={14} /></button>
          <button type="button" onClick={() => handleFormat('bullet')} title="Danh sách gạch đầu dòng"><List size={14} /></button>
          <button type="button" onClick={() => handleFormat('numbered')} title="Danh sách đánh số"><ListOrdered size={14} /></button>
        </div>
      )}
      <textarea
        ref={textAreaRef}
        className="block-textarea"
        value={block.text || ''}
        onChange={(e) => update({ text: e.target.value })}
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );

  const renderEditor = () => {
    switch (block.type) {
      case 'heading':
      case 'paragraph':
      case 'explanation':
      case 'example':
      case 'formula':
      case 'tip':
        return renderTextEditor(
          block.type === 'heading' ? 'Nhập tiêu đề...' : 'Nhập nội dung... (dùng **bold**, *italic*, - gạch đầu dòng, 1. đánh số)',
          block.type === 'heading' ? 1 : 3,
        );
      case 'image':
        return (
          <div className="block-image-editor">
            {block.imageDataUrl ? (
              <div className="block-image-preview">
                <img src={block.imageDataUrl} alt={block.imageCaption || ''} />
                <div className="block-image-actions">
                  <button className="block-mini-btn" onClick={() => imageInputRef.current?.click()}>
                    <Upload size={13} /> Thay hình
                  </button>
                  <button className="block-mini-btn danger" onClick={() => update({ imageDataUrl: undefined, imageFileName: undefined })}>
                    <X size={13} /> Xóa hình
                  </button>
                </div>
              </div>
            ) : (
              <button className="block-upload-area" onClick={() => imageInputRef.current?.click()}>
                <ImageIcon size={24} />
                <span>Chọn hình ảnh từ máy tính</span>
                <small>PNG, JPG, JPEG, WEBP</small>
              </button>
            )}
            <input ref={imageInputRef} type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" onChange={handleImageSelect} hidden />
            <input
              className="block-input"
              value={block.imageCaption || ''}
              onChange={(e) => update({ imageCaption: e.target.value })}
              placeholder="Chú thích hình ảnh (không bắt buộc)"
            />
          </div>
        );
      case 'video':
        return (
          <div className="block-video-editor">
            <input
              className="block-input"
              value={block.videoUrl || ''}
              onChange={(e) => update({ videoUrl: e.target.value })}
              placeholder="Dán link video (YouTube, Vimeo, hoặc link trực tiếp MP4...)"
            />
            {block.videoUrl && (
              <small className="block-hint">Sinh viên sẽ xem video ngay trong bài giảng.</small>
            )}
          </div>
        );
      case 'slide':
        return (
          <div className="block-slide-editor">
            <input
              className="block-input"
              value={block.slideUrl || ''}
              onChange={(e) => update({ slideUrl: e.target.value })}
              placeholder="Hoặc dán link PDF trực tiếp (https://.../file.pdf)"
            />
            {block.slideFileName ? (
              <div className="block-slide-card">
                <div className={`block-slide-icon ${block.slideFileType}`}>
                  <FileText size={20} />
                </div>
                <div className="block-slide-info">
                  <strong>{block.slideFileName}</strong>
                  <span>{block.slideFileType?.toUpperCase()} {block.slideFileSize ? `· ${block.slideFileSize}` : ''}</span>
                </div>
                <div className="block-slide-actions">
                  <button className="block-mini-btn" onClick={() => slideInputRef.current?.click()}>
                    <Upload size={13} /> Thay file
                  </button>
                  <button className="block-mini-btn danger" onClick={() => update({ slideFileName: undefined, slideFileType: undefined, slideFileSize: undefined })}>
                    <X size={13} /> Xóa file
                  </button>
                </div>
              </div>
            ) : (
              <button className="block-upload-area" onClick={() => slideInputRef.current?.click()}>
                <FileText size={24} />
                <span>Upload file PowerPoint hoặc PDF</span>
                <small>.PPTX, .PDF — File PDF sẽ hiển thị trực tiếp trên trình duyệt</small>
              </button>
            )}
            <input ref={slideInputRef} type="file" accept=".pptx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={handleSlideSelect} hidden />
            <input
              className="block-input"
              value={block.slideCaption || ''}
              onChange={(e) => update({ slideCaption: e.target.value })}
              placeholder="Tiêu đề / chú thích slide (không bắt buộc)"
            />
          </div>
        );
      case 'question':
        return (
          <div className="block-question-editor">
            <textarea
              className="block-textarea"
              value={block.questionText || ''}
              onChange={(e) => update({ questionText: e.target.value })}
              placeholder="Nhập câu hỏi... (VD: Em nghĩ đáp án nào đúng?)"
              rows={2}
            />
            <div className="block-choices">
              {(block.questionChoices || []).map((choice, idx) => (
                <div className="block-choice-row" key={choice.id}>
                  <button
                    className={`block-choice-correct ${choice.correct ? 'active' : ''}`}
                    onClick={() => update({
                      questionChoices: block.questionChoices?.map((c) => ({
                        ...c,
                        correct: c.id === choice.id,
                      })),
                      questionCorrectIndex: idx,
                    })}
                    title="Đánh dấu đáp án đúng"
                  >
                    {String.fromCharCode(65 + idx)}
                  </button>
                  <input
                    className="block-input"
                    value={choice.text}
                    onChange={(e) => update({
                      questionChoices: block.questionChoices?.map((c) =>
                        c.id === choice.id ? { ...c, text: e.target.value } : c
                      ),
                    })}
                    placeholder={`Đáp án ${String.fromCharCode(65 + idx)}...`}
                  />
                  <button
                    className="block-mini-btn danger"
                    onClick={() => update({
                      questionChoices: block.questionChoices?.filter((c) => c.id !== choice.id),
                    })}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
              <button
                className="block-add-quiz"
                onClick={() => update({
                  questionChoices: [...(block.questionChoices || []), { id: genId('ch'), text: '', correct: false }],
                })}
              >
                + Thêm đáp án
              </button>
            </div>
            <textarea
              className="block-textarea"
              value={block.questionExplanation || ''}
              onChange={(e) => update({ questionExplanation: e.target.value })}
              placeholder="Lời giải (không bắt buộc)..."
              rows={2}
            />
          </div>
        );
      case 'exercise':
        return (
          <div className="block-exercise-editor">
            <textarea
              className="block-textarea"
              value={block.exerciseQuestion || ''}
              onChange={(e) => update({ exerciseQuestion: e.target.value })}
              placeholder="Nhập đề bài tập... (VD: Cho tam giác ABC vuông tại A, biết AB = 3cm và AC = 4cm. Tính BC.)"
              rows={3}
            />
            <div className="block-exercise-answer-row">
              <div className="status-toggle" style={{ width: '120px' }}>
                <button
                  className={block.exerciseAnswerType === 'text' ? 'active' : ''}
                  onClick={() => update({ exerciseAnswerType: 'text' })}
                >
                  Chữ
                </button>
                <button
                  className={block.exerciseAnswerType === 'number' ? 'active' : ''}
                  onClick={() => update({ exerciseAnswerType: 'number' })}
                >
                  Số
                </button>
              </div>
              <input
                className="block-input"
                type={block.exerciseAnswerType === 'number' ? 'number' : 'text'}
                value={block.exerciseAnswer || ''}
                onChange={(e) => update({ exerciseAnswer: e.target.value })}
                placeholder="Nhập đáp án đúng..."
              />
            </div>
            <textarea
              className="block-textarea"
              value={block.exerciseExplanation || ''}
              onChange={(e) => update({ exerciseExplanation: e.target.value })}
              placeholder="Lời giải chi tiết (không bắt buộc)..."
              rows={2}
            />
          </div>
        );
      case 'quiz':
        return (
          <div className="block-quiz-editor">
            {(block.quizItems || []).map((item, idx) => (
              <div className="quiz-item-editor" key={item.id}>
                <div className="quiz-item-head">
                  <span>Câu {idx + 1}</span>
                  <button className="block-mini-btn danger" onClick={() => update({ quizItems: block.quizItems?.filter((q) => q.id !== item.id) })}>
                    <Trash2 size={13} />
                  </button>
                </div>
                <input
                  className="block-input"
                  value={item.question}
                  onChange={(e) => update({ quizItems: block.quizItems?.map((q) => q.id === item.id ? { ...q, question: e.target.value } : q) })}
                  placeholder="Nhập câu hỏi..."
                />
                <div className="block-choices">
                  {(item.choices || []).map((choice, ci) => (
                    <div className="block-choice-row" key={choice.id}>
                      <button
                        className={`block-choice-correct ${choice.correct ? 'active' : ''}`}
                        onClick={() => update({
                          quizItems: block.quizItems?.map((q) =>
                            q.id === item.id
                              ? { ...q, choices: q.choices?.map((c) => ({ ...c, correct: c.id === choice.id })) }
                              : q
                          ),
                        })}
                      >
                        {String.fromCharCode(65 + ci)}
                      </button>
                      <input
                        className="block-input"
                        value={choice.text}
                        onChange={(e) => update({
                          quizItems: block.quizItems?.map((q) =>
                            q.id === item.id
                              ? { ...q, choices: q.choices?.map((c) => c.id === choice.id ? { ...c, text: e.target.value } : c) }
                              : q
                          ),
                        })}
                        placeholder={`Đáp án ${String.fromCharCode(65 + ci)}...`}
                      />
                      <button
                        className="block-mini-btn danger"
                        onClick={() => update({
                          quizItems: block.quizItems?.map((q) =>
                            q.id === item.id
                              ? { ...q, choices: q.choices?.filter((c) => c.id !== choice.id) }
                              : q
                          ),
                        })}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                  <button
                    className="block-add-quiz"
                    onClick={() => update({
                      quizItems: block.quizItems?.map((q) =>
                        q.id === item.id
                          ? { ...q, choices: [...(q.choices || []), { id: genId('ch'), text: '', correct: false }] }
                          : q
                      ),
                    })}
                  >
                    + Thêm đáp án
                  </button>
                </div>
                <input
                  className="block-input"
                  value={item.explanation || ''}
                  onChange={(e) => update({ quizItems: block.quizItems?.map((q) => q.id === item.id ? { ...q, explanation: e.target.value } : q) })}
                  placeholder="Giải thích (không bắt buộc)..."
                />
              </div>
            ))}
            <button
              className="block-add-quiz"
              onClick={() => update({
                quizItems: [...(block.quizItems || []), {
                  id: genId('q'),
                  question: '',
                  choices: [
                    { id: genId('ch'), text: '', correct: true },
                    { id: genId('ch'), text: '', correct: false },
                  ],
                  explanation: '',
                }],
              })}
            >
              + Thêm câu hỏi
            </button>
          </div>
        );
      case 'summary':
        return (
          <div className="block-summary-editor">
            {(block.summaryItems || []).map((item, idx) => (
              <div className="block-summary-row" key={idx}>
                <span className="block-summary-dot">•</span>
                <input
                  className="block-input"
                  value={item}
                  onChange={(e) => update({
                    summaryItems: block.summaryItems?.map((s, i) => i === idx ? e.target.value : s),
                  })}
                  placeholder="Nhập ý chính cần nhớ..."
                />
                <button
                  className="block-mini-btn danger"
                  onClick={() => update({ summaryItems: block.summaryItems?.filter((_, i) => i !== idx) })}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            <button
              className="block-add-quiz"
              onClick={() => update({ summaryItems: [...(block.summaryItems || []), ''] })}
            >
              + Thêm ý chính
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`block-editor ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
    >
      <div className="block-editor-grip" aria-label="Kéo để di chuyển">
        <GripVertical size={16} />
      </div>
      <div className="block-editor-body">
        <div className="block-editor-head">
          <div className={`block-type-badge ${meta.color}`}>
            <Icon size={14} />
            <span>{BLOCK_LABELS[block.type]}</span>
          </div>
          <div className="block-editor-actions">
            <button className="block-action-btn" onClick={onMoveUp} disabled={!canMoveUp} title="Lên trên">
              <ArrowUp size={14} />
            </button>
            <button className="block-action-btn" onClick={onMoveDown} disabled={!canMoveDown} title="Xuống dưới">
              <ArrowDown size={14} />
            </button>
            <button className="block-action-btn" onClick={onDuplicate} title="Nhân đôi">
              <Copy size={14} />
            </button>
            <button className="block-delete-btn" onClick={onDelete} aria-label="Xóa block" title="Xóa">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
        {renderEditor()}
      </div>
    </div>
  );
}

export function AddBlockMenu({ onAdd }: { onAdd: (type: Block['type']) => void }) {
  const types = Object.keys(BLOCK_LABELS) as Block['type'][];
  return (
    <div className="add-block-menu">
      <div className="add-block-grid">
        {types.map((type) => {
          const meta = BLOCK_META[type];
          const Icon = meta.icon;
          return (
            <button key={type} className="add-block-item" onClick={() => onAdd(type)}>
              <span className={`add-block-icon ${meta.color}`}><Icon size={16} /></span>
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { createBlock };
