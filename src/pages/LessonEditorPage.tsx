import { ArrowLeft, Eye, FileText, Plus, Save, Send } from 'lucide-react';
import { useState } from 'react';
import type { Block, BlockType, Route } from '../types';
import { createBlock, findLesson } from '../store';
import { useStore } from '../store';
import { AddBlockMenu, BlockEditor } from '../blocks/BlockEditor';
import { BlockPreview } from '../blocks/BlockPreview';
import { Button } from '../ui/Button';
import { toast } from '../ui/Toast';

interface LessonEditorPageProps {
  route: Extract<Route, { name: 'lesson-editor' }>;
  onBack: () => void;
}

export function LessonEditorPage({ route, onBack }: LessonEditorPageProps) {
  const store = useStore();
  const lesson = findLesson(store.data, route.subjectId, route.chapterId, route.lessonId);

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (!lesson) {
    return (
      <div className="page-container">
        <div className="empty-hint">Không tìm thấy bài giảng.</div>
        <Button variant="outline" onClick={onBack}><ArrowLeft size={15} /> Quay lại</Button>
      </div>
    );
  }

  const blocks = lesson.blocks;

  const addBlock = async (type: BlockType) => {
    const newBlock = createBlock(type);
    await store.insertBlock(lesson.id, newBlock);
    setShowAddMenu(false);
    toast('Đã thêm block mới');
  };

  const updateBlock = (index: number, block: Block) => {
    store.updateBlock(lesson.id, block.id, block);
  };

  const deleteBlock = (index: number) => {
    if (!confirm('Xóa block này?')) return;
    store.deleteBlock(lesson.id, blocks[index].id);
    toast('Đã xóa block', 'info');
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    store.reorderBlocks(lesson.id, index, index - 1);
  };

  const moveDown = (index: number) => {
    if (index === blocks.length - 1) return;
    store.reorderBlocks(lesson.id, index, index + 1);
  };

  const duplicateBlock = async (index: number) => {
    const orig = blocks[index];
    const dup: Block = { ...orig, id: `b${Date.now().toString(36)}d${index}` };
    await store.insertBlock(lesson.id, dup);
    const newIndex = blocks.length;
    await store.reorderBlocks(lesson.id, newIndex, index + 1);
    toast('Đã nhân đôi block');
  };

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragEnter = (index: number) => {
    if (dragIndex !== null && dragIndex !== index) {
      setDragOverIndex(index);
    }
  };
  const handleDragEnd = () => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      store.reorderBlocks(lesson.id, dragIndex, dragOverIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleSaveDraft = () => {
    store.updateLesson(lesson.id, { status: 'draft' });
    toast('Đã lưu nháp');
  };

  const handlePublish = () => {
    store.updateLesson(lesson.id, { status: 'published' });
    toast('Đã xuất bản bài giảng');
  };

  if (previewMode) {
    return (
      <div className="page-container">
        <div className="preview-toolbar">
          <Button variant="outline" size="sm" onClick={() => setPreviewMode(false)}><ArrowLeft size={15} /> Quay lại soạn thảo</Button>
          <div className="preview-label">
            <Eye size={15} />
            <span>Xem trước — Giao diện học viên</span>
          </div>
        </div>
        <article className="preview-article">
          <div className="preview-article-head">
            <span className="preview-status">{lesson.status === 'draft' ? 'Bản nháp' : 'Đã xuất bản'}</span>
            <h1>{lesson.name}</h1>
            <span className="preview-duration"><FileText size={13} /> {lesson.duration}</span>
          </div>
          <div className="preview-blocks">
            {blocks.length === 0 ? (
              <p className="empty-hint">Bài giảng chưa có nội dung.</p>
            ) : (
              blocks.map((block) => <BlockPreview key={block.id} block={block} />)
            )}
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="editor-toolbar">
        <div className="editor-toolbar-left">
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft size={15} /> Môn học</Button>
          <div className="editor-title">
            <strong>{lesson.name}</strong>
            <span className={`lesson-status ${lesson.status}`}>{lesson.status === 'draft' ? 'Bản nháp' : 'Đã xuất bản'}</span>
          </div>
        </div>
        <div className="editor-toolbar-right">
          <Button variant="outline" size="sm" onClick={handleSaveDraft}><Save size={15} /> Lưu nháp</Button>
          <Button variant="outline" size="sm" onClick={() => setPreviewMode(true)}><Eye size={15} /> Xem trước</Button>
          <Button size="sm" onClick={handlePublish}><Send size={15} /> Xuất bản</Button>
        </div>
      </div>

      <div className="editor-body">
        <div className="block-list">
          {blocks.length === 0 && (
            <div className="editor-empty">
              <FileText size={32} />
              <p>Bài giảng chưa có nội dung</p>
              <small>Bấm "Thêm nội dung" để bắt đầu soạn bài</small>
            </div>
          )}
          {blocks.map((block, index) => (
            <BlockEditor
              key={block.id}
              block={block}
              onChange={(b) => updateBlock(index, b)}
              onDelete={() => deleteBlock(index)}
              onMoveUp={() => moveUp(index)}
              onMoveDown={() => moveDown(index)}
              onDuplicate={() => duplicateBlock(index)}
              canMoveUp={index > 0}
              canMoveDown={index < blocks.length - 1}
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              isDragging={dragIndex === index}
              isDragOver={dragOverIndex === index}
            />
          ))}
        </div>

        <div className="add-content-section">
          {showAddMenu ? (
            <AddBlockMenu onAdd={addBlock} />
          ) : (
            <button className="add-content-btn" onClick={() => setShowAddMenu(true)}>
              <Plus size={18} /> Thêm nội dung
            </button>
          )}
          {showAddMenu && (
            <button className="add-content-cancel" onClick={() => setShowAddMenu(false)}>Hủy</button>
          )}
        </div>
      </div>
    </div>
  );
}
