import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import type { Project } from '../types/project';

export function useProjectFilters(projects: Project[]) {
  const [tagInput, setTagInput] = useState('');
  const [debouncedTagInput, setDebouncedTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedTagInput(tagInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [tagInput]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    projects.forEach((project) => {
      project.tags.forEach((tag) => tagSet.add(tag));
      project.techStack.forEach((tech) => tagSet.add(tech));
    });
    return Array.from(tagSet).sort();
  }, [projects]);

  const suggestions = useMemo(() => {
    if (!tagInput.trim()) return [];
    const input = tagInput.toLowerCase();
    return allTags.filter(
      (tag) => tag.toLowerCase().includes(input) && !selectedTags.includes(tag)
    );
  }, [tagInput, allTags, selectedTags]);

  const filteredProjects = useMemo(() => {
    if (selectedTags.length === 0) return projects;

    return projects.filter((project) =>
      selectedTags.every((tag) => project.tags.includes(tag) || project.techStack.includes(tag))
    );
  }, [projects, selectedTags]);

  const addTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && suggestions.length > 0) {
      event.preventDefault();
      addTag(suggestions[0]);
    } else if (event.key === 'Backspace' && tagInput === '' && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  };

  return {
    tagInput,
    setTagInput,
    selectedTags,
    setSelectedTags,
    suggestions,
    filteredProjects,
    debouncedTagInput,
    addTag,
    removeTag,
    handleKeyDown,
  };
}
