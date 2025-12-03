import { useState, useEffect } from 'react';
import { CheckCircle, Circle, AlertCircle, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface StoryMapProps {
    sessionId: string;
}

interface StoryData {
    tasks: string[];
    backend_tasks: string[];
    frontend_tasks: string[];
    total_tasks: number;
    effort_distribution: {
        High: number;
        Medium: number;
        Low: number;
    };
}

interface StoryMap {
    stories: Record<string, StoryData>;
    orphan_tasks: string[];
    total_stories: number;
    total_tasks: number;
}

const StoryMapViewer: React.FC<StoryMapProps> = ({ sessionId }) => {
    const [storyMap, setStoryMap] = useState<StoryMap | null>(null);
    const [taskStatuses, setTaskStatuses] = useState<Record<string, string>>({});
    const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStoryMap();
        loadTaskStatuses();
    }, [sessionId]);

    const loadStoryMap = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/projects/${sessionId}/story_map`);
            if (response.ok) {
                const data = await response.json();
                setStoryMap(data.data);
            }
        } catch (error) {
            console.error('Failed to load story map:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTaskStatuses = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/projects/${sessionId}/task_statuses`);
            if (response.ok) {
                const data = await response.json();
                setTaskStatuses(data.task_statuses || {});
            }
        } catch (error) {
            console.error('Failed to load task statuses:', error);
        }
    };

    const toggleStory = (storyName: string) => {
        const newExpanded = new Set(expandedStories);
        if (newExpanded.has(storyName)) {
            newExpanded.delete(storyName);
        } else {
            newExpanded.add(storyName);
        }
        setExpandedStories(newExpanded);
    };

    const getStoryProgress = (story: StoryData): number => {
        const completedTasks = story.tasks.filter(taskId => taskStatuses[taskId] === 'complete');
        return story.total_tasks > 0 ? (completedTasks.length / story.total_tasks) * 100 : 0;
    };

    const getStoryStatus = (story: StoryData): 'complete' | 'in-progress' | 'blocked' | 'pending' => {
        const hasError = story.tasks.some(taskId => taskStatuses[taskId] === 'error');
        const hasComplete = story.tasks.some(taskId => taskStatuses[taskId] === 'complete');
        const allComplete = story.tasks.every(taskId => taskStatuses[taskId] === 'complete');

        if (allComplete) return 'complete';
        if (hasError) return 'blocked';
        if (hasComplete) return 'in-progress';
        return 'pending';
    };

    const getTaskIcon = (taskId: string) => {
        const status = taskStatuses[taskId];
        switch (status) {
            case 'complete':
                return <CheckCircle size={14} className="text-green-500" />;
            case 'error':
                return <AlertCircle size={14} className="text-red-500" />;
            case 'loading':
                return <Clock size={14} className="text-blue-500 animate-spin" />;
            default:
                return <Circle size={14} className="text-gray-400" />;
        }
    };

    const getEffortColor = (effort: string): string => {
        switch (effort) {
            case 'High':
                return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
            case 'Medium':
                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'Low':
                return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Clock className="animate-spin mr-2" size={20} />
                <span>Loading story map...</span>
            </div>
        );
    }

    if (!storyMap) {
        return (
            <div className="p-8 text-center text-gray-500">
                No story map available. Generate a sprint plan first.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{storyMap.total_stories}</div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">Total Stories</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{storyMap.total_tasks}</div>
                    <div className="text-sm text-purple-700 dark:text-purple-300">Total Tasks</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{storyMap.orphan_tasks.length}</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">Orphan Tasks</div>
                </div>
            </div>

            {/* Stories List */}
            <div className="space-y-3">
                {Object.entries(storyMap.stories).map(([storyName, story]) => {
                    const progress = getStoryProgress(story);
                    const status = getStoryStatus(story);
                    const isExpanded = expandedStories.has(storyName);

                    const statusColors = {
                        complete: 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/10',
                        'in-progress': 'border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10',
                        blocked: 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10',
                        pending: 'border-gray-200 dark:border-gray-700 bg-[hsl(var(--card))]',
                    };

                    return (
                        <div
                            key={storyName}
                            className={`rounded-lg border ${statusColors[status]} overflow-hidden transition-all`}
                        >
                            {/* Story Header */}
                            <div
                                className="p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                onClick={() => toggleStory(storyName)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                        <button className="mt-1">
                                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                        </button>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg mb-2">{storyName}</h3>

                                            {/* Progress Bar */}
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                                                <div
                                                    className={`h-2 rounded-full transition-all ${status === 'complete' ? 'bg-green-500' :
                                                        status === 'blocked' ? 'bg-red-500' :
                                                            status === 'in-progress' ? 'bg-blue-500' :
                                                                'bg-gray-400'
                                                        }`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>

                                            {/* Stats */}
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    {story.total_tasks} tasks
                                                </span>
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    {story.backend_tasks.length} backend
                                                </span>
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    {story.frontend_tasks.length} frontend
                                                </span>
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    {progress.toFixed(0)}% complete
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Effort Distribution */}
                                    <div className="flex gap-2 ml-4">
                                        {story.effort_distribution.High > 0 && (
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getEffortColor('High')}`}>
                                                {story.effort_distribution.High}H
                                            </span>
                                        )}
                                        {story.effort_distribution.Medium > 0 && (
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getEffortColor('Medium')}`}>
                                                {story.effort_distribution.Medium}M
                                            </span>
                                        )}
                                        {story.effort_distribution.Low > 0 && (
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getEffortColor('Low')}`}>
                                                {story.effort_distribution.Low}L
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Task List (Expanded) */}
                            {isExpanded && (
                                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white/50 dark:bg-black/20">
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Backend Tasks */}
                                        {story.backend_tasks.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                                    Backend ({story.backend_tasks.length})
                                                </h4>
                                                <div className="space-y-1">
                                                    {story.backend_tasks.map(taskId => (
                                                        <div key={taskId} className="flex items-center gap-2 text-sm">
                                                            {getTaskIcon(taskId)}
                                                            <span className="font-mono text-xs">{taskId}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Frontend Tasks */}
                                        {story.frontend_tasks.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                                    Frontend ({story.frontend_tasks.length})
                                                </h4>
                                                <div className="space-y-1">
                                                    {story.frontend_tasks.map(taskId => (
                                                        <div key={taskId} className="flex items-center gap-2 text-sm">
                                                            {getTaskIcon(taskId)}
                                                            <span className="font-mono text-xs">{taskId}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Orphan Tasks */}
            {storyMap.orphan_tasks.length > 0 && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
                    <h3 className="font-semibold mb-3">Orphan Tasks (No Story)</h3>
                    <div className="flex flex-wrap gap-2">
                        {storyMap.orphan_tasks.map(taskId => (
                            <div key={taskId} className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                                {getTaskIcon(taskId)}
                                <span className="font-mono text-xs">{taskId}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoryMapViewer;
