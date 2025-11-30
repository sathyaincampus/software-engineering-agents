import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { FileText, Download, Clock, Folder, ChevronRight, FolderOpen } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8050';

interface Project {
    session_id: string;
    project_name: string;
    created_at: string;
    last_modified: string;
    steps_completed: string[];
}

interface ProjectFile {
    path: string;
    size: number;
    modified: string;
}

const ProjectHistory: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { loadProject } = useProject();

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/projects`);
            setProjects(res.data);
        } catch (e) {
            console.error('Failed to load projects:', e);
        }
    };

    const loadProjectDetails = async (sessionId: string) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/projects/${sessionId}`);
            setProjectFiles(res.data.files || []);
            setSelectedProject(sessionId);
        } catch (e) {
            console.error('Failed to load project details:', e);
        } finally {
            setLoading(false);
        }
    };

    const loadProjectIntoMissionControl = async (sessionId: string) => {
        try {
            setLoading(true);
            await loadProject(sessionId);
            navigate('/');
        } catch (e) {
            console.error('Failed to load project:', e);
            alert('Failed to load project. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const downloadProject = async (sessionId: string) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/projects/${sessionId}/export`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `project-${sessionId}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {
            console.error('Failed to download project:', e);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleString();
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight mb-2">Project History</h2>
                <p className="text-gray-500">View and download your saved projects</p>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Projects List */}
                <div className="col-span-5 space-y-3">
                    {projects.length === 0 ? (
                        <div className="text-center py-12 bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))]">
                            <Folder className="mx-auto text-gray-400 mb-3" size={48} />
                            <p className="text-gray-500">No projects yet</p>
                            <p className="text-sm text-gray-400 mt-1">Start a new project in Mission Control</p>
                        </div>
                    ) : (
                        projects.map((project) => (
                            <div
                                key={project.session_id}
                                onClick={() => loadProjectDetails(project.session_id)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedProject === project.session_id
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-[hsl(var(--border))] hover:border-gray-400 bg-[hsl(var(--card))]'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-base mb-1">{project.project_name}</h3>
                                        <span className="font-mono text-xs text-gray-500">
                                            {project.session_id.substring(0, 8)}...
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            downloadProject(project.session_id);
                                        }}
                                        className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                                    >
                                        <Download size={16} className="text-blue-500" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {formatDate(project.last_modified)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <FileText size={12} />
                                        {project.steps_completed.length} steps
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Project Details */}
                <div className="col-span-7">
                    {selectedProject ? (
                        <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold">Project Files</h3>
                                    <p className="text-sm text-gray-500 font-mono">{selectedProject}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => loadProjectIntoMissionControl(selectedProject)}
                                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                                    >
                                        <FolderOpen size={16} />
                                        Load Project
                                    </button>
                                    <button
                                        onClick={() => downloadProject(selectedProject)}
                                        className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2"
                                    >
                                        <Download size={16} />
                                        Download ZIP
                                    </button>
                                </div>
                            </div>

                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                                    <p className="text-gray-500 mt-3">Loading files...</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {projectFiles.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">No files found</p>
                                    ) : (
                                        projectFiles.map((file, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FileText size={16} className="text-gray-400" />
                                                    <div>
                                                        <p className="font-mono text-sm">{file.path}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {formatSize(file.size)} • Modified {formatDate(file.modified)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <ChevronRight size={16} className="text-gray-400" />
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-12 text-center">
                            <Folder className="mx-auto text-gray-400 mb-3" size={48} />
                            <p className="text-gray-500">Select a project to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectHistory;
