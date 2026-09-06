import {
  FileText,
  GripVertical,
  Image as ImageIcon,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useRef, type ChangeEvent } from 'react';
import type { Block } from '../types';
import { BLOCK_LABELS, createBlock, genId } from '../store';
import { BLOCK_META } from './BlockPreview';

interface BlockEditorProps {
  block: Block;
  onChange: (block: Block) => void;
  onDelete: () => void;
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

export function BlockEditor({
  block,
  onChange,
  onDelete,
  onDragStart,
  onDragEnter,
  onDragEnd,
  isDragging,
  isDragOver,
}: BlockEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const slideInputRef = useRef<HTMLInputElement>(null);
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

  const renderEditor = () => {
    switch (block.type) {
      case 'heading':
      case 'paragraph':
      case 'explanation':
      case 'example':
      case 'formula':
      case 'tip':
      case 'exercise':
      case 'summary':
        return (
          <textarea
            className="block-textarea"
            value={block.text || ''}
            onChange={(e) => update({ text: e.target.value })}
            placeholder={block.type === 'heading' ? 'Nhập tiêu đề...' : 'Nhập nội dung...'}
            rows={block.type === 'heading' ? 1 : 3}
          />
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
          <input
            className="block-input"
            value={block.videoUrl || ''}
            onChange={(e) => update({ videoUrl: e.target.value })}
            placeholder="Dán link video (YouTube, Vimeo...)"
          />
        );
      case 'slide':
        return (
          <div className="block-slide-editor">
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
                <small>.PPTX, .PDF</small>
              </button>
            )}
            <input ref={slideInputRef} type="file" accept=".pptx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={handleSlideSelect} hidden />
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
                <input
                  className="block-input"
                  value={item.answer}
                  onChange={(e) => update({ quizItems: block.quizItems?.map((q) => q.id === item.id ? { ...q, answer: e.target.value } : q) })}
                  placeholder="Nhập đáp án..."
                />
              </div>
            ))}
            <button
              className="block-add-quiz"
              onClick={() => update({ quizItems: [...(block.quizItems || []), { id: genId('q'), question: '', answer: '' }] })}
            >
              + Thêm câu hỏi
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
          <button className="block-delete-btn" onClick={onDelete} aria-label="Xóa block">
            <Trash2 size={15} />
          </button>
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
