import { useState } from 'react';
import type { Project } from '../types/project';
import { uploadImage } from '../utils/api';
import ActionCard from './ActionCard';
import ColorPicker from './ColorPicker';
import FormSection from './FormSection';
import IconPicker from './IconPicker';
import ScreenshotCard from './ScreenshotCard';
import Toast from './Toast';
import PlusIcon from './svg/PlusIcon';
import TrashIcon from './svg/TrashIcon';

interface EditData {
  code: string;
  title: string;
  summary: string;
  description: string;
  techStack: string;
  tags: string;
  features: string;
  links: {
    name: string;
    url: string;
    backgroundColor?: string;
    textColor?: string;
    icon?: string;
  }[];
  screenshots: { file_uuid: string; caption?: string }[];
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
}

export default function ProjectEditForm({ project, onSave, onCancel }: ProjectEditFormProps) {
  const [editData, setEditData] = useState<EditData>(() => projectToEditData(project));
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  // 링크
  const handleAddLink = () => {
    setEditData((prev) => ({
      ...prev,
      links: [...prev.links, { name: '', url: '', backgroundColor: '', textColor: '', icon: '' }],
    }));
  };

  const handleRemoveLink = (index: number) => {
    setEditData((prev) => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index),
    }));
  };

  const handleLinkChange = (index: number, field: string, value: string) => {
    setEditData((prev) => ({
      ...prev,
      links: prev.links.map((link, i) => (i === index ? { ...link, [field]: value } : link)),
    }));
  };

  // 스크린샷
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
        screenshots: prev.screenshots.filter((_, i) => i !== index),
        thumbnailFileUuid:
          prev.thumbnailFileUuid === removed?.file_uuid ? undefined : prev.thumbnailFileUuid,
      };
    });
  };

  const handleScreenshotChange = (index: number, field: string, value: string) => {
    setEditData((prev) => ({
      ...prev,
      screenshots: prev.screenshots.map((screenshot, i) =>
        i === index ? { ...screenshot, [field]: value } : screenshot
      ),
    }));
  };

  const handleScreenshotFileChange = async (index: number, file: File) => {
    try {
      const result = await uploadImage(file);
      setEditData((prev) => ({
        ...prev,
        screenshots: prev.screenshots.map((s, i) =>
          i === index ? { ...s, file_uuid: result.uuid } : s
        ),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : '스크린샷 업로드에 실패했습니다.';
      setToastMessage(message);
    }
  };

  const handleCancel = () => {
    setEditData(projectToEditData(project));
    onCancel();
  };

  const confirmCancel = () => {
    if (window.confirm('편집을 취소하시겠습니까? 변경된 내용이 저장되지 않습니다.')) {
      handleCancel();
    }
  };

  const handleSave = () => {
    onSave(editData);
  };

  return (
    <>
      {toastMessage && (
        <Toast message={toastMessage} type="error" onClose={() => setToastMessage(null)} />
      )}
      {/* 제목 + 버튼 */}
      <div className="flex items-start justify-between mb-2">
        <input
          type="text"
          name="title"
          value={editData.title}
          onChange={handleEditChange}
          className="text-3xl font-bold text-gray-900 w-full border-b-2 border-blue-500 focus:outline-none bg-transparent"
        />
        <div className="flex gap-2 ml-4 flex-shrink-0">
          <button
            onClick={confirmCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            저장
          </button>
        </div>
      </div>

      {/* 프로젝트 코드 */}
      <FormSection
        title="프로젝트 코드"
        description="프로젝트를 식별하는 고유 코드입니다"
        className="mb-4"
      >
        <input
          type="text"
          name="code"
          value={editData.code}
          onChange={handleEditChange}
          placeholder="프로젝트 고유 코드 (예: PRJ001)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </FormSection>

      {/* 태그 */}
      <FormSection title="태그" description="쉼표(,)로 구분하여 입력하세요" className="mb-4">
        <input
          type="text"
          name="tags"
          value={editData.tags}
          onChange={handleEditChange}
          placeholder="태그 (쉼표로 구분)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </FormSection>

      {/* 요약 */}
      <FormSection title="요약">
        <input
          type="text"
          name="summary"
          value={editData.summary}
          onChange={handleEditChange}
          placeholder="요약"
          className="w-full text-lg text-gray-600 mb-6 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </FormSection>

      {/* 링크 관리 */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">링크 관리</h3>
        <div className="space-y-4">
          {editData.links.map((link, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md border-2 border-gray-200 hover:border-blue-500 transition-all"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="text-base font-semibold text-gray-900">링크 #{index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => handleRemoveLink(index)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="링크 삭제"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                      <input
                        type="text"
                        value={link.name}
                        onChange={(e) => handleLinkChange(index, 'name', e.target.value)}
                        placeholder="예: GitHub, Demo"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ColorPicker
                      label="배경색 (선택)"
                      value={link.backgroundColor || ''}
                      defaultColor="#3B82F6"
                      placeholder="#3B82F6"
                      onChange={(v) => handleLinkChange(index, 'backgroundColor', v)}
                    />
                    <ColorPicker
                      label="텍스트색 (선택)"
                      value={link.textColor || ''}
                      defaultColor="#FFFFFF"
                      placeholder="#FFFFFF"
                      onChange={(v) => handleLinkChange(index, 'textColor', v)}
                    />
                    <IconPicker
                      label="아이콘 (선택)"
                      value={link.icon || ''}
                      onChange={(v) => handleLinkChange(index, 'icon', v)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          <ActionCard
            icon={
              <PlusIcon className="w-16 h-16 text-gray-400 group-hover:text-blue-500 transition-colors" />
            }
            title="링크 추가"
            description="새로운 링크를 추가합니다"
            onClick={handleAddLink}
          />
        </div>
      </div>

      {/* 스크린샷 관리 */}
      <div className="border-t border-gray-200 pt-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">스크린샷 관리</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {editData.screenshots.map((screenshot, index) => (
            <ScreenshotCard
              key={index}
              screenshot={screenshot}
              index={index}
              isThumbnail={
                editData.thumbnailFileUuid === screenshot.file_uuid && screenshot.file_uuid !== ''
              }
              onToggleThumbnail={() =>
                setEditData((prev) => ({
                  ...prev,
                  thumbnailFileId:
                    prev.thumbnailFileUuid === screenshot.file_uuid
                      ? undefined
                      : screenshot.file_uuid,
                }))
              }
              onRemove={() => handleRemoveScreenshot(index)}
              onFileChange={(file) => handleScreenshotFileChange(index, file)}
              onCaptionChange={(caption) => handleScreenshotChange(index, 'caption', caption)}
            />
          ))}
          <ActionCard
            icon={
              <PlusIcon className="w-16 h-16 text-gray-400 group-hover:text-blue-500 transition-colors" />
            }
            title="스크린샷 추가"
            description="새로운 스크린샷을 추가합니다"
            onClick={handleAddScreenshot}
          />
        </div>
      </div>

      {/* 프로젝트 설명 */}
      <FormSection
        title="프로젝트 설명"
        description="프로젝트에 대한 상세 설명을 입력하세요"
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

      {/* 기술 스택 */}
      <FormSection
        title="기술 스택 태그"
        description="쉼표(,)로 구분하여 입력하세요"
        className="mb-8"
      >
        <input
          type="text"
          name="techStack"
          value={editData.techStack}
          onChange={handleEditChange}
          placeholder="React, TypeScript, Tailwind (쉼표로 구분)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </FormSection>

      {/* 주요 기능 */}
      <FormSection title="주요 기능" description="한 줄에 하나씩 입력하세요" className="mb-8">
        <textarea
          name="features"
          value={editData.features}
          onChange={handleEditChange}
          rows={5}
          placeholder="기능 1&#10;기능 2&#10;기능 3"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </FormSection>

      {/* 날짜 / 공개여부 */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
            <input
              type="date"
              name="startDate"
              value={editData.startDate}
              onChange={handleEditChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
            <input
              type="date"
              name="endDate"
              value={editData.endDate}
              onChange={handleEditChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <label className="text-sm font-medium text-gray-700">공개 여부</label>
          <button
            type="button"
            onClick={() => setEditData((prev) => ({ ...prev, isPublic: !prev.isPublic }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              editData.isPublic ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                editData.isPublic ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-gray-500">{editData.isPublic ? '공개' : '비공개'}</span>
        </div>
      </div>

      {/* 하단 저장/취소 버튼 */}
      <div className="flex justify-end gap-2 mt-8 pt-8 border-t border-gray-200">
        <button
          onClick={confirmCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          저장
        </button>
      </div>
    </>
  );
}
