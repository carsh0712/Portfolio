import type { ProjectLink } from '../types/project';
import { renderIconByName } from '../utils/icons';

interface ProjectLinksProps {
  links: ProjectLink[];
}

export default function ProjectLinks({ links }: ProjectLinksProps) {
  if (links.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-3">
        {links.map((link, index) => (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: link.backgroundColor || link.background_color || '#3B82F6',
              color: link.textColor || link.text_color || '#FFFFFF',
            }}
          >
            {link.icon && renderIconByName(link.icon) && (
              <span className="mr-2">{renderIconByName(link.icon)}</span>
            )}
            {link.name}
          </a>
        ))}
      </div>
    </div>
  );
}
