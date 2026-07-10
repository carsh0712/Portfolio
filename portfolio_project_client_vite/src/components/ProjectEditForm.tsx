import { useState } from 'react';
import type { ChangeEvent } from 'react';
import type { Project, ProjectLink, Screenshot } from '../types/project';
import { uploadImage } from '../utils/api';
import FormSection from './FormSection';
import Modal from './Modal';
import ProjectEditActions from './ProjectEditActions';
import ProjectLinkEditor from './ProjectLinkEditor';
import ProjectScreenshotEditor from './ProjectScreenshotEditor';
import ProjectVisibilityFields from './ProjectVisibilityFields';
import Toast from './Toast';

interface EditData {
  code: string;
  title: string;
  summary: string;
  description: string;
  techStack: string;
  tags: string;
  features: string;
  links: ProjectLink[];
  screenshots: Screenshot[];
  thumbnailFileUuid?: string;
  startDate: string;
  endDate: string;
  isPublic: boolean;
}

function projectToEditData(project: Project): EditData {
  return {
    code: project.code || '',
    title: project.title,
    summary: project.summary,
    description: project.description,
    techStack: project.techStack.join(', '),
    tags: project.tags.join(', '),
    features: project.features.join('\n'),
    links: project.links || [],
    screenshots: project.screenshots || [],
    thumbnailFileUuid: project.thumbnailFileUuid,
    startDate: project.startDate,
    endDate: project.endDate || '',
    isPublic: project.isPublic ?? true,
  };
}

interface ProjectEditFormProps {
  project: Project;
  onSave: (data: EditData) => void;
  onCancel: () => void;
  onDelete?: () => Promise<void> | void;
}

export default function ProjectEditForm({
  project,
  onSave,
  onCancel,
  onDelete,
}: ProjectEditFormProps) {
  const [editData, setEditData] = useState<EditData>(() => projectToEditData(project));
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmCode, setDeleteConfirmCode] = useState('');

  const handleEditChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddLink = () => {
    setEditData((prev) => ({
      ...prev,
      links: [...prev.links, { name: '', url: '', backgroundColor: '', textColor: '', icon: '' }],
    }));
  };

  const handleRemoveLink = (index: number) => {
    setEditData((prev) => ({
      ...prev,
      links: prev.links.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleLinkChange = (index: number, field: keyof ProjectLink, value: string) => {
    setEditData((prev) => ({
      ...prev,
      links: prev.links.map((link, itemIndex) =>
        itemIndex === index ? { ...link, [field]: value } : link
      ),
    }));
  };

  const handleAddScreenshot = () => {
    setEditData((prev) => ({
      ...prev,
      screenshots: [...prev.screenshots, { file_uuid: '', caption: '' }],
    }));
  };

  const handleRemoveScreenshot = (index: number) => {
    setEditData((prev) => {
      const removed = prev.screenshots[index];

      return {
        ...prev,
        screenshots: prev.screenshots.filter((_, itemIndex) => itemIndex !== index),
        thumbnailFileUuid:
          prev.thumbnailFileUuid === removed?.file_uuid ? undefined : prev.thumbnailFileUuid,
      };
    });
  };

  const handleScreenshotCaptionChange = (index: number, caption: string) => {
    setEditData((prev) => ({
      ...prev,
      screenshots: prev.screenshots.map((screenshot, itemIndex) =>
        itemIndex === index ? { ...screenshot, caption } : screenshot
      ),
    }));
  };

  const handleScreenshotFileChange = async (index: number, file: File) => {
    try {
      const result = await uploadImage(file);

      setEditData((prev) => ({
        ...prev,
        screenshots: prev.screenshots.map((screenshot, itemIndex) =>
          itemIndex === index ? { ...screenshot, file_uuid: result.uuid } : screenshot
        ),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : '스크린샷 업로드에 실패했습니다.';
      setToastMessage(message);
    }
  };

  const handleToggleThumbnail = (fileUuid: string) => {
    if (!fileUuid) return;

    setEditData((prev) => ({
      ...prev,
      thumbnailFileUuid: prev.thumbnailFileUuid === fileUuid ? undefined : fileUuid,
    }));
  };

  const handleCancel = () => {
    setEditData(projectToEditData(project));
    onCancel();
  };

  const confirmCancel = () => {
    if (window.confirm('편집을 취소하시겠습니까? 변경된 내용은 저장되지 않습니다.')) {
      handleCancel();
    }
  };

  const closeDeleteDialog = () => {
    if (isDeleting) return;
    setIsDeleteDialogOpen(false);
    setDeleteConfirmCode('');
  };

  const confirmDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      const message = error instanceof Error ? error.message : '프로젝트 삭제에 실패했습니다.';
      setToastMessage(message);
      setIsDeleting(false);
    }
  };

  const togglePublic = () => {
    setEditData((prev) => ({ ...prev, isPublic: !prev.isPublic }));
  };

  const canDelete = deleteConfirmCode === project.code && !isDeleting;

  return (
    <>
      {toastMessage && (
        <Toast message={toastMessage} type="error" onClose={() => setToastMessage(null)} />
      )}

      <div className="flex items-start justify-between mb-2">
        <input
          type="text"
          name="title"
          value={editData.title}
          onChange={handleEditChange}
          placeholder="프로젝트 제목"
          className="text-3xl font-bold text-gray-900 w-full border-b-2 border-blue-500 focus:outline-none bg-transparent"
        />
        <ProjectEditActions
          onCancel={confirmCancel}
          onSave={() => onSave(editData)}
          className="ml-4 flex-shrink-0"
        />
      </div>

      <FormSection
        title="프로젝트 코드"
        description="프로젝트를 식별하는 고유 코드입니다."
        className="mb-4"
      >
        <input
          type="text"
          name="code"
          value={editData.code}
          onChange={handleEditChange}
          placeholder="예: PRJ001"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </FormSection>

      <FormSection title="태그" description="쉼표(,)로 구분하여 입력하세요." className="mb-4">
        <input
          type="text"
          name="tags"
          value={editData.tags}
          onChange={handleEditChange}
          placeholder="React, TypeScript"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </FormSection>

      <FormSection title="요약" className="mb-4">
        <input
          type="text"
          name="summary"
          value={editData.summary}
          onChange={handleEditChange}
          placeholder="프로젝트 요약"
          className="w-full text-lg text-gray-600 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </FormSection>

      <ProjectLinkEditor
        links={editData.links}
        onAdd={handleAddLink}
        onRemove={handleRemoveLink}
        onChange={handleLinkChange}
      />

      <ProjectScreenshotEditor
        screenshots={editData.screenshots}
        thumbnailFileUuid={editData.thumbnailFileUuid}
        onAdd={handleAddScreenshot}
        onRemove={handleRemoveScreenshot}
        onFileChange={handleScreenshotFileChange}
        onCaptionChange={handleScreenshotCaptionChange}
        onToggleThumbnail={handleToggleThumbnail}
      />

      <FormSection
        title="프로젝트 설명"
        description="프로젝트에 대한 상세 설명을 입력하세요."
        className="mb-8"
      >
        <textarea
          name="description"
          value={editData.description}
          onChange={handleEditChange}
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </FormSection>

      <FormSection title="기술 스택" description="쉼표(,)로 구분하여 입력하세요." className="mb-8">
        <input
          type="text"
          name="techStack"
          value={editData.techStack}
          onChange={handleEditChange}
          placeholder="React, TypeScript, Tailwind"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </FormSection>

      <FormSection title="주요 기능" description="한 줄에 하나씩 입력하세요." className="mb-8">
        <textarea
          name="features"
          value={editData.features}
          onChange={handleEditChange}
          rows={5}
          placeholder={'기능 1\n기능 2\n기능 3'}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </FormSection>

      <ProjectVisibilityFields
        startDate={editData.startDate}
        endDate={editData.endDate}
        isPublic={editData.isPublic}
        onDateChange={handleEditChange}
        onTogglePublic={togglePublic}
      />

      <ProjectEditActions
        onCancel={confirmCancel}
        onSave={() => onSave(editData)}
        className="mt-8 pt-8 border-t border-gray-200"
      />

      {onDelete && (
        <section className="mt-8 pt-8 border-t border-red-200">
          <div className="rounded-lg border border-red-200 bg-red-50 p-5">
            <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
            <p className="mt-2 text-sm leading-6 text-red-800">
              이 프로젝트와 연결된 이미지 파일이 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </p>
            <button
              type="button"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isDeleting}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? '삭제 중...' : '프로젝트 삭제'}
            </button>
          </div>
        </section>
      )}

      <Modal isOpen={isDeleteDialogOpen} onClose={closeDeleteDialog} title="프로젝트 삭제">
        <div className="space-y-5">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm leading-6 text-red-900">
              <strong className="font-semibold">{project.title}</strong> 프로젝트를 삭제합니다.
              프로젝트 정보와 연결된 이미지 파일은 삭제 후 복구할 수 없습니다.
            </p>
          </div>

          <label className="block">
            <span className="block text-sm font-medium text-gray-900">
              삭제하려면 프로젝트 코드 <span className="font-semibold">{project.code}</span> 를
              입력하세요.
            </span>
            <input
              type="text"
              value={deleteConfirmCode}
              onChange={(event) => setDeleteConfirmCode(event.target.value)}
              disabled={isDeleting}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
              autoComplete="off"
            />
          </label>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeDeleteDialog}
              disabled={isDeleting}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              취소
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={!canDelete}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? '삭제 중...' : '영구 삭제'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
