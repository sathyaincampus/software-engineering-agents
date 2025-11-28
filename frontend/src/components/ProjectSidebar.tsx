import { useState, useEffect } from 'react';
import { Folder, FolderOpen, Clock, ChevronRight } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

interface Project {
    session_id: string;
    created_at: string;
    last_modified: string;
    steps_completed: string[];
}

const ProjectSidebar = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('projectSidebarExpanded');
            return saved !== null ? saved === 'true' : true;
        }
        return true;
    });
    const { sessionId, loadProject } = useProject();

    const toggleExpanded = () => {
        const newState = !expanded;
        setExpanded(newState);
        if (typeof window !== 'undefined') {
            localStorage.setItem('projectSidebarExpanded', String(newState));
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await fetch('http://localhost:8050/projects');
            if (response.ok) {
                const data = await response.json();
                // Sort by last modified, most recent first
                const sorted = data.sort((a: Project, b: Project) =>
                    new Date(b.last_modified).getTime() - new Date(a.last_modified).getTime()
                );
                setProjects(sorted.slice(0, 10)); // Show last 10 projects
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProjectClick = async (projectId: string) => {
        try {
            await loadProject(projectId);
        } catch (error) {
            console.error('Failed to load project:', error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getStepProgress = (steps: string[]) => {
        const totalSteps = 9; // Total possible steps
        const percentage = (steps.length / totalSteps) * 100;
        return Math.round(percentage);
    };

    if (!expanded) {
        return (
            <div className="w-12 bg-gray-900/50 border-r border-gray-800 flex flex-col items-center py-4">
                <button
                    onClick={toggleExpanded}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                    title="Expand projects"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        );
    }

    return (
        <div className="w-64 bg-gray-900/50 border-r border-gray-800 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Folder className="text-blue-400" size={18} />
                    <h3 className="font-semibold text-sm">Recent Projects</h3>
                </div>
                <button
                    onClick={toggleExpanded}
                    className="p-1 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-white"
                >
                    <ChevronRight size={16} className="rotate-180" />
                </button>
            </div>

            {/* Projects List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                        Loading projects...
                    </div>
                ) : projects.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                        No projects yet
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        {projects.map((project) => {
                            const isActive = sessionId === project.session_id;
                            const progress = getStepProgress(project.steps_completed);

                            return (
                                <button
                                    key={project.session_id}
                                    onClick={() => handleProjectClick(project.session_id)}
                                    className={`w-full text-left p-3 rounded-lg transition-all ${isActive
                                        ? 'bg-blue-600/20 border border-blue-500/50'
                                        : 'hover:bg-gray-800/50 border border-transparent'
                                        }`}
                                >
                                    <div className="flex items-start gap-2">
                                        {isActive ? (
                                            <FolderOpen className="text-blue-400 flex-shrink-0 mt-0.5" size={16} />
                                        ) : (
                                            <Folder className="text-gray-500 flex-shrink-0 mt-0.5" size={16} />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">
                                                {project.session_id.slice(0, 8)}...
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                                <Clock size={10} />
                                                <span>{formatDate(project.last_modified)}</span>
                                            </div>
                                            {/* Progress Bar */}
                                            <div className="mt-2">
                                                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                                    <span>{progress}% complete</span>
                                                    <span>{project.steps_completed.length}/9</span>
                                                </div>
                                                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all ${isActive ? 'bg-blue-500' : 'bg-gray-600'
                                                            }`}
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-800">
                <button
                    onClick={fetchProjects}
                    className="w-full text-xs text-gray-400 hover:text-white transition-colors py-2 hover:bg-gray-800 rounded"
                >
                    Refresh Projects
                </button>
            </div>
        </div>
    );
};

export default ProjectSidebar;
