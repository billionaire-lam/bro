import { ArrowLeft, Clock, FileText } from 'lucide-react';
import type { Route } from '../types';
import { findLesson, useStore } from '../store';
import { Button } from '../ui/Button';
import { BlockPreview } from '../blocks/BlockPreview';

interface Props {
  route: Extract<Route, { name: 'lesson-view' }>;
  onBack: () => void;
}

export function LessonViewPage({ route, onBack }: Props) {
  const store = useStore();
  const lesson = findLesson(store.data, route.subjectId, route.chapterId, route.lessonId);

  if (!lesson) {
    return (
      <div className="page-container">
        <div className="empty-hint">Không tìm thấy bài giảng.</div>
        <Button variant="outline" onClick={onBack}><ArrowLeft size={15} /> Quay lại</Button>
      </div>
    );
  }

  const blocks = lesson.blocks.filter((b) => b.text?.trim() || b.imageDataUrl || b.videoUrl || b.slideUrl || b.questionText || b.exerciseQuestion || b.quizItems?.length || b.summaryItems?.length);

  return (
    <div className="page-container">
      <div className="preview-toolbar">
        <Button variant="outline" size="sm" onClick={onBack}><ArrowLeft size={15} /> Quay lại</Button>
        <div className="preview-label">
          <FileText size={15} />
          <span>Bài giảng</span>
        </div>
      </div>
      <article className="preview-article">
        <div className="preview-article-head">
          <span className={`preview-status ${lesson.status}`}>{lesson.status === 'draft' ? 'Bản nháp' : 'Đã xuất bản'}</span>
          <h1>{lesson.name}</h1>
          <span className="preview-duration"><Clock size={13} /> {lesson.duration}</span>
        </div>
        {lesson.description && <p className="pv-paragraph" style={{ color: '#8993a4', marginBottom: '16px' }}>{lesson.description}</p>}
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
