import { Link } from 'react-router-dom';
import type { Project } from '../types/project';

interface ProjectCardProps {
  project: Project;
  linkPath?: string;
}

export default function ProjectCard({ project, linkPath }: ProjectCardProps) {
  const defaultPath = `/category/${project.categoryId}/project/${project.id}`;
  const path = linkPath || defaultPath;

  return (
    <Link
      to={path}
      className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group"
    >
      <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <span className="text-white text-4xl font-bold opacity-50 group-hover:opacity-70 transition-opacity">
          {project.title.charAt(0)}
        </span>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {project.title}
          </h3>
          {project.isPublic !== undefined && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                project.isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {project.isPublic ? '공개' : '비공개'}
            </span>
          )}
        </div>
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
      </div>
    </Link>
  );
}
