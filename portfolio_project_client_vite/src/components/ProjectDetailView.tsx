import type { ReactNode } from 'react';
import type { Project } from '../types/project';
import ProjectLinks from './ProjectLinks';
import type { FileVariant } from '../utils/api';

interface ProjectDetailViewProps {
  project: Project;
  actions?: ReactNode;
  renderImage: (fileUuid: string, alt: string, className: string, variant?: FileVariant) => ReactNode;
  onScreenshotSelect: (index: number) => void;
}

export default function ProjectDetailView({
  project,
  actions,
  renderImage,
  onScreenshotSelect,
}: ProjectDetailViewProps) {
  const screenshots = project.screenshots || [];

  return (
    <>
      <div className="flex items-start justify-between mb-2">
        <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
        {actions && <div className="flex items-center gap-2 ml-4 flex-shrink-0">{actions}</div>}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
          >
            #{tag}
          </span>
        ))}
      </div>

      <p className="text-lg text-gray-600 mb-6">{project.summary}</p>

      {project.links && project.links.length > 0 && <ProjectLinks links={project.links} />}

      <div className="border-t border-gray-200 pt-8">
        {screenshots.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">스크린샷</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {screenshots.map((screenshot, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => onScreenshotSelect(index)}
                  className="group relative overflow-hidden rounded-lg aspect-video bg-gray-100 hover:ring-2 hover:ring-blue-500 transition-all"
                >
                  {renderImage(
                    screenshot.file_uuid,
                    screenshot.caption || `스크린샷 ${index + 1}`,
                    'w-full h-full object-cover group-hover:scale-105 transition-transform',
                    'thumbnail'
                  )}
                  {screenshot.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-sm px-2 py-1">
                      {screenshot.caption}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-xl font-semibold text-gray-900 mb-4">프로젝트 설명</h2>
        <p className="text-gray-700 leading-relaxed whitespace-pre-line mb-8">
          {project.description}
        </p>

        {project.techStack.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">기술 스택</h2>
            <div className="flex flex-wrap gap-2 mb-8">
              {project.techStack.map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  #{tech}
                </span>
              ))}
            </div>
          </>
        )}

        {project.features.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">주요 기능</h2>
            <ul className="space-y-3 mb-8">
              {project.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-3 mt-0.5 flex-shrink-0">✓</span>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="pt-8 border-t border-gray-200">
          <div className="flex gap-8 text-sm text-gray-500">
            <div>
              <span className="font-medium">시작일</span> {project.startDate}
            </div>
            {project.endDate && (
              <div>
                <span className="font-medium">종료일</span> {project.endDate}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
