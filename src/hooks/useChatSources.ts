// src/hooks/useChatSources.ts
import { useState } from 'react';

interface Project {
  id: string;
  name: string;
  description?: string;
  client_id: string;
}

export const useChatSources = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showSourcesModal, setShowSourcesModal] = useState(false);

  const openSourcesModal = () => {
    setShowSourcesModal(true);
  };

  const closeSourcesModal = () => {
    setShowSourcesModal(false);
  };

  const selectProject = (project: Project) => {
    setSelectedProject(project);
    setShowSourcesModal(false);
  };

  const clearSelection = () => {
    setSelectedProject(null);
  };

  return {
    selectedProject,
    showSourcesModal,
    openSourcesModal,
    closeSourcesModal,
    selectProject,
    clearSelection
  };
};