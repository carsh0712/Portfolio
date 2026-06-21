import type { Screenshot } from '../types/project';
import ActionCard from './ActionCard';
import ScreenshotCard from './ScreenshotCard';
import PlusIcon from './svg/PlusIcon';

interface ProjectScreenshotEditorProps {
  screenshots: Screenshot[];
  thumbnailFileUuid?: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onFileChange: (index: number, file: File) => void;
  onCaptionChange: (index: number, caption: string) => void;
  onToggleThumbnail: (fileUuid: string) => void;
}

export default function ProjectScreenshotEditor({
  screenshots,
  thumbnailFileUuid,
  onAdd,
  onRemove,
  onFileChange,
  onCaptionChange,
  onToggleThumbnail,
}: ProjectScreenshotEditorProps) {
  return (
    <section className="border-t border-gray-200 pt-8 mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">스크린샷 관리</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {screenshots.map((screenshot, index) => (
          <ScreenshotCard
            key={index}
            screenshot={screenshot}
            index={index}
            isThumbnail={thumbnailFileUuid === screenshot.file_uuid && screenshot.file_uuid !== ''}
            onToggleThumbnail={() => onToggleThumbnail(screenshot.file_uuid)}
            onRemove={() => onRemove(index)}
            onFileChange={(file) => onFileChange(index, file)}
            onCaptionChange={(caption) => onCaptionChange(index, caption)}
          />
        ))}
        <ActionCard
          icon={
            <PlusIcon className="w-16 h-16 text-gray-400 group-hover:text-blue-500 transition-colors" />
          }
          title="스크린샷 추가"
          description="새 스크린샷을 추가합니다."
          onClick={onAdd}
        />
      </div>
    </section>
  );
}
