import { Link } from 'react-router-dom';
import type { Project } from '../types/project';
import AuthImage from './AuthImage';
import PublicStatusBadge from './PublicStatusBadge';

interface ProjectCardProps {
  project: Project;
  linkPath?: string;
  thumbnailUrl?: string;
}

export default function ProjectCard({ project, linkPath, thumbnailUrl }: ProjectCardProps) {
  const defaultPath = `/portfolio/${project.categoryId}/project/${project.code}`;
  const path = linkPath || defaultPath;

  return (
    <Link
      to={path}
      className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group"
    >
      {project.thumbnailFileId ? (
        <div className="h-48 overflow-hidden">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <AuthImage
              fileId={project.thumbnailFileId}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white text-4xl font-bold opacity-50 group-hover:opacity-70 transition-opacity">
            {project.title.charAt(0)}
          </span>
        </div>
      )}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
          {project.title}
        </h3>
        <p className="text-gray-600 mb-4 line-clamp-2">{project.summary}</p>
        <div className="flex flex-wrap gap-2">
          {project.techStack.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
            >
              #{tech}
            </span>
          ))}
          {project.techStack.length > 4 && (
            <span className="px-3 py-1 bg-slate-100 text-slate-500 text-sm rounded-full">
              +{project.techStack.length - 4}
            </span>
          )}
        </div>
        {project.isPublic !== undefined && (
          <div className="mt-4">
            <PublicStatusBadge isPublic={project.isPublic} />
          </div>
        )}
      </div>
    </Link>
  );
}
