import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import MarkdownViewer from '../components/MarkdownViewer';
import ArchitectureViewer from '../components/ArchitectureViewer';
import CodeViewer from '../components/CodeViewer';
import CodeWalkthrough from '../components/CodeWalkthrough';
import StoryMapViewer from '../components/StoryMapViewer';
import { useProject } from '../context/ProjectContext';
import {
    Lightbulb,
    FileText,
    Search,
    Cpu,
    Code,
    CheckCircle,
    Play,
    Loader2,
    Terminal,
    ArrowRight,
    Sparkles,
    Layout,
    Server,
    RefreshCw,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8050';

// --- Types ---
interface Idea {
    title: string;
    pitch: string;
    features: string[];
    audience: string;
    monetization: string;
}

interface UserStory {
    id: string;
    title: string;
    description: string;
    priority: string;
}

interface Architecture {
    stack: any;
    diagrams: any;
}

interface SprintPlan {
    sprint_plan: any[];
}

// --- Components ---

const StatusBadge = ({ status }: { status: 'pending' | 'loading' | 'complete' | 'active' | 'error' | 'skipped' }) => {
    const styles = {
        pending: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
        loading: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800 animate-pulse',
        active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700',
        complete: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800',
        error: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800',
        skipped: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    };

    const icons = {
        pending: <div className="w-2 h-2 rounded-full bg-gray-400" />,
        loading: <Loader2 size={12} className="animate-spin" />,
        active: <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />,
        complete: <CheckCircle size={12} />,
        error: <div className="w-2 h-2 rounded-full bg-red-500" />,
        skipped: <div className="w-2 h-2 rounded-full bg-yellow-500" />,
    };

    return (
        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
            {icons[status]}
            <span className="capitalize">{status}</span>
        </div>
    );
};

const StepCard = ({ title, icon: Icon, isActive, isComplete, children, action, onRegenerate }: any) => {
    if (!isActive && !isComplete) return null;

    return (
        <div className={`relative overflow-hidden rounded-2xl border transition-all duration-500 ${isActive
            ? 'bg-[hsl(var(--card))] border-blue-500/50 shadow-2xl shadow-blue-500/10 ring-1 ring-blue-500/20'
            : 'bg-[hsl(var(--card))] border-[hsl(var(--border))] opacity-60 hover:opacity-100'
            }`}>
            {isActive && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />}
            <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${isActive ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                            <Icon size={20} />
                        </div>
                        <div>
                            <h3 className={`text-lg font-bold ${isActive ? 'text-[hsl(var(--foreground))]' : 'text-gray-500'}`}>{title}</h3>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Phase {isActive ? 'Active' : 'Complete'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {(isActive || isComplete) && onRegenerate && (
                            <button
                                onClick={onRegenerate}
                                className="px-3 py-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-1.5 transition-colors"
                                title="Regenerate this step"
                            >
                                <RefreshCw size={14} />
                                Regenerate
                            </button>
                        )}
                        <StatusBadge status={isActive ? 'active' : 'complete'} />
                    </div>
                </div>

                <div className={`space-y-4 ${!isActive && 'grayscale-[0.5]'}`}>
                    {children}
                </div>

                {action && (
                    <div className="mt-6 pt-6 border-t border-[hsl(var(--border))]">
                        {action}
                    </div>
                )}
            </div>
        </div>
    );
};

const MissionControl: React.FC = () => {
    // --- State ---
    const [projectName, setProjectName] = useState('');
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const [taskStatuses, setTaskStatuses] = useState<Record<string, any>>({});
    const [sprintView, setSprintView] = useState<'tasks' | 'storymap'>('tasks');
    const [projectFiles, setProjectFiles] = useState<any[]>([]);
    const [showCodeBrowser, setShowCodeBrowser] = useState(false);
    const [showWalkthrough, setShowWalkthrough] = useState(false);
    const [logsCollapsed, setLogsCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('logsCollapsed') === 'true';
        }
        return false;
    });

    // Use ProjectContext instead of local state
    const {
        sessionId: contextSessionId,
        setSessionId: setContextSessionId,
        keywords,
        setKeywords,
        ideas,
        setIdeas,
        selectedIdea,
        setSelectedIdea,
        prd,
        setPrd,
        userStories,
        setUserStories,
        architecture,
        setArchitecture,
        sprintPlan,
        setSprintPlan,
        activeStep,
        setActiveStep
    } = useProject();

    // Local session ID for backward compatibility
    const [localSessionId, setLocalSessionId] = useState<string | null>(null);
    const sessionId = contextSessionId || localSessionId;

    // --- Helpers ---
    const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const toggleLogs = () => {
        const newState = !logsCollapsed;
        setLogsCollapsed(newState);
        if (typeof window !== 'undefined') {
            localStorage.setItem('logsCollapsed', String(newState));
        }
    };

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    // Load task statuses when session ID changes
    useEffect(() => {
        const loadTaskStatuses = async () => {
            if (!sessionId) return;

            try {
                const res = await axios.get(`${API_BASE_URL}/projects/${sessionId}/task_statuses`);
                if (res.data && res.data.task_statuses) {
                    setTaskStatuses(res.data.task_statuses);
                    addLog(`📊 Loaded ${Object.keys(res.data.task_statuses).length} task statuses`);
                }
            } catch (e) {
                console.log('No task statuses found (this is normal for new projects)');
            }
        };

        loadTaskStatuses();
    }, [sessionId]);

    // Trigger sprint execution when step 5 is active
    useEffect(() => {
        if (activeStep === 5 && sprintPlan && Object.keys(taskStatuses).length === 0) {
            runSprint();
        }
    }, [activeStep, sprintPlan]);

    // --- API Calls ---
    const startSession = async () => {
        if (!projectName) return;
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/session/start`, { project_name: projectName });
            setContextSessionId(res.data.session_id);
            setLocalSessionId(res.data.session_id);
            addLog(`Session initialized: ${res.data.session_id}`);
            setActiveStep(1);
        } catch (e) { console.error(e); addLog("Error starting session"); }
        finally { setLoading(false); }
    };

    const generateIdeas = async () => {
        setLoading(true);
        try {
            addLog(`Agent [IdeaGenerator] activated for: "${keywords}"`);
            const res = await axios.post(`${API_BASE_URL}/agent/idea_generator/run?session_id=${sessionId}`, { keywords });

            console.log("Raw response from backend:", res.data);

            // Handle different response formats
            let ideasArray = null;

            if (res.data.ideas) {
                ideasArray = res.data.ideas;
            } else if (res.data.app_ideas) {
                // Map app_ideas format to expected format
                ideasArray = res.data.app_ideas.map((idea: any) => ({
                    title: idea.title,
                    pitch: idea.one_line_pitch || idea.pitch,
                    features: idea.core_features || idea.features || [],
                    audience: idea.target_audience || idea.audience,
                    monetization: idea.monetization_strategy || idea.monetization
                }));
            } else if (Array.isArray(res.data)) {
                ideasArray = res.data;
            } else if (res.data.raw_output) {
                addLog(`Warning: ${res.data.error || 'Response format issue'}`);
                addLog(`Raw output: ${res.data.raw_output.substring(0, 200)}...`);
            }

            if (ideasArray) {
                setIdeas(ideasArray);
                addLog(`✓ Generated ${ideasArray.length} ideas successfully`);
            } else {
                console.log("Unexpected format, trying to parse:", res.data);
                addLog("⚠ Ideas generated but format unexpected (check console)");
            }

        } catch (e) {
            console.error("Error generating ideas:", e);
            addLog("✗ Error generating ideas");
        }
        finally { setLoading(false); }
    };

    const generatePRD = async () => {
        if (!selectedIdea) return;
        setLoading(true);
        try {
            addLog(`Agent [ProductManager] activated for: "${selectedIdea.title}"`);
            const res = await axios.post(`${API_BASE_URL}/agent/product_requirements/run?session_id=${sessionId}`, { idea_context: selectedIdea });
            setPrd(res.data.prd);
            addLog("PRD generated successfully.");
            setActiveStep(2);
        } catch (e) { console.error(e); addLog("Error generating PRD"); }
        finally { setLoading(false); }
    };

    const analyzePRD = async () => {
        if (!prd) return;
        setLoading(true);
        try {
            addLog("Agent [BusinessAnalyst] analyzing requirements...");
            const res = await axios.post(`${API_BASE_URL}/agent/requirement_analysis/run?session_id=${sessionId}`, { prd_content: prd });

            console.log("User stories response:", res.data);

            // Handle both array and object formats
            const stories = Array.isArray(res.data) ? res.data : (res.data.stories || res.data.user_stories || []);

            setUserStories(stories);
            addLog(`✓ Extracted ${stories.length} user stories`);
            setActiveStep(3);
        } catch (e) {
            console.error("Error analyzing PRD:", e);
            addLog("✗ Error analyzing PRD");
        }
        finally { setLoading(false); }
    };

    const designArchitecture = async () => {
        if (!userStories) return;
        setLoading(true);
        try {
            addLog("Agent [SoftwareArchitect] designing system...");
            const res = await axios.post(`${API_BASE_URL}/agent/software_architect/run?session_id=${sessionId}`, { requirements: { stories: userStories } });

            console.log("Architecture response:", res.data);

            setArchitecture(res.data);
            addLog("✓ Architecture design complete");
            setActiveStep(4);
        } catch (e) {
            console.error("Error designing architecture:", e);
            addLog("✗ Error designing architecture");
        }
        finally { setLoading(false); }
    };

    const createSprintPlan = async () => {
        if (!userStories || !architecture) return;
        setLoading(true);
        try {
            addLog("Agent [EngineeringManager] creating sprint plan...");
            const res = await axios.post(`${API_BASE_URL}/agent/engineering_manager/run?session_id=${sessionId}`, { user_stories: userStories, architecture: architecture });
            console.log("Sprint plan response:", res.data);

            if (res.data.error) {
                addLog(`Error: ${res.data.error}`);
                return;
            }

            setSprintPlan(res.data);
            addLog("Sprint Plan ready.");
            setActiveStep(5);
        } catch (e) { console.error(e); addLog("Error creating sprint plan"); }
        finally { setLoading(false); }
    };

    const runSprint = async (resumeFromCurrent = false) => {
        const tasks = Array.isArray(sprintPlan) ? sprintPlan : (sprintPlan?.sprint_plan || []);
        if (!tasks.length) return;

        // Track which tasks failed in THIS run (not previous runs)
        const failedInThisRun = new Set<string>();

        // If resuming, keep existing statuses; otherwise initialize
        if (!resumeFromCurrent) {
            const initialStatuses: Record<string, any> = {};
            tasks.forEach((t: any) => initialStatuses[t.task_id] = 'pending');
            setTaskStatuses(initialStatuses);
        }

        addLog("🚀 Starting Engineering Sprint...");

        for (const task of tasks) {
            // Skip tasks that are already complete
            const currentStatus = taskStatuses[task.task_id];
            if (currentStatus === 'complete') {
                addLog(`⏭️  Skipping ${task.task_id} (already complete)`);
                continue;
            }

            // Check for failed dependencies (only from THIS run)
            const hasDependencyFailures = checkDependencies(task, tasks, failedInThisRun);
            if (hasDependencyFailures) {
                addLog(`⏭️  Skipping ${task.task_id}: Dependencies failed`);
                addLog(`   💡 ${hasDependencyFailures}`);
                setTaskStatuses(prev => ({ ...prev, [task.task_id]: 'skipped' }));
                failedInThisRun.add(task.task_id); // Mark as failed in this run
                continue;
            }

            setTaskStatuses(prev => ({ ...prev, [task.task_id]: 'loading' }));
            addLog(`Assigning ${task.task_id} to [${task.assignee}]...`);

            try {
                const endpoint = task.assignee.toLowerCase().includes('frontend')
                    ? '/agent/frontend_dev/run'
                    : '/agent/backend_dev/run';

                const context = {
                    architecture,
                    user_stories: userStories,
                    prd
                };

                const response = await axios.post(`${API_BASE_URL}${endpoint}?session_id=${sessionId}`, {
                    task,
                    context
                });

                // Check if response contains an error
                if (response.data.error) {
                    const errorType = response.data.error_type;
                    const retryAfter = response.data.retry_after;
                    const recoverable = response.data.recoverable;

                    addLog(`❌ ${task.task_id} failed: ${response.data.error}`);
                    if (response.data.suggestion) {
                        addLog(`💡 ${response.data.suggestion}`);
                    }
                    if (response.data.details) {
                        addLog(`📝 Details: ${response.data.details}`);
                    }

                    // Handle different error types
                    if (errorType === 'rate_limit' && retryAfter) {
                        addLog(`⏸️  Pausing sprint. Will retry in ${retryAfter} seconds...`);
                        setTaskStatuses(prev => ({ ...prev, [task.task_id]: 'error' }));

                        // Show countdown and auto-retry
                        for (let i = retryAfter; i > 0; i--) {
                            addLog(`⏳ Retrying in ${i} seconds...`);
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }

                        addLog(`🔄 Retrying ${task.task_id}...`);
                        // Retry the task by recursively calling itself
                        await retryTask(task);
                        continue;

                    } else if (errorType === 'token_exhausted') {
                        addLog(`🛑 Sprint paused: Token limit exceeded`);
                        addLog(`💡 Please reduce context size or use a larger model`);
                        setTaskStatuses(prev => ({ ...prev, [task.task_id]: 'error' }));
                        failedInThisRun.add(task.task_id); // Track failure
                        // Stop the sprint - user needs to intervene
                        return;

                    } else if (recoverable === false) {
                        // Explicitly marked as unrecoverable
                        addLog(`🛑 Sprint paused: Unrecoverable error`);
                        setTaskStatuses(prev => ({ ...prev, [task.task_id]: 'error' }));
                        failedInThisRun.add(task.task_id); // Track failure
                        // Stop the sprint
                        return;
                    } else {
                        // Generic error or agent error (no error_type)
                        // Mark as error but check if we should continue
                        setTaskStatuses(prev => ({ ...prev, [task.task_id]: 'error' }));
                        failedInThisRun.add(task.task_id); // Track failure

                        // Check if any remaining tasks depend on this one
                        const dependentTasks = findDependentTasks(task, tasks);
                        if (dependentTasks.length > 0) {
                            addLog(`⚠️  ${task.task_id} failed - ${dependentTasks.length} dependent task(s) will be skipped`);
                        } else {
                            addLog(`⚠️  ${task.task_id} failed, continuing to next task...`);
                        }
                    }
                } else {
                    // Success
                    setTaskStatuses(prev => ({ ...prev, [task.task_id]: 'complete' }));
                    addLog(`✓ ${task.task_id} completed.`);
                }
            } catch (e: any) {
                console.error(`Error executing task ${task.task_id}:`, e);

                // Check if it's a network error or server error
                if (e.response?.status === 500) {
                    addLog(`❌ ${task.task_id} failed: Server error`);
                } else if (!e.response) {
                    addLog(`❌ ${task.task_id} failed: Network error`);
                } else {
                    addLog(`❌ ${task.task_id} failed: ${e.message}`);
                }

                setTaskStatuses(prev => ({ ...prev, [task.task_id]: 'error' }));
                failedInThisRun.add(task.task_id); // Track failure

                // For critical errors, pause the sprint
                if (e.response?.status === 500) {
                    addLog(`🛑 Sprint paused due to server error`);
                    return;
                }
            }
        }

        addLog("🏁 Sprint completed. All tasks executed.");
    };

    // Helper function to check if a task's dependencies have failed
    const checkDependencies = (
        task: any,
        allTasks: any[],
        failedInThisRun: Set<string>
    ): string | null => {
        // If task has a story_id, check if any earlier tasks in the same story failed IN THIS RUN
        if (task.story_id) {
            const currentTaskIndex = allTasks.findIndex(t => t.task_id === task.task_id);

            // Find all earlier tasks in the same story
            const earlierTasksInStory = allTasks
                .slice(0, currentTaskIndex)
                .filter(t => t.story_id === task.story_id);

            // Check if any of them failed IN THIS RUN
            const failedDependencies = earlierTasksInStory.filter(t =>
                failedInThisRun.has(t.task_id)
            );

            if (failedDependencies.length > 0) {
                const failedIds = failedDependencies.map(t => t.task_id).join(', ');
                return `Required task(s) failed: ${failedIds}`;
            }
        }

        // For frontend tasks, check if corresponding backend tasks exist and succeeded
        if (task.assignee.toLowerCase().includes('frontend') && task.story_id) {
            const backendTasksInStory = allTasks.filter(t =>
                t.story_id === task.story_id &&
                t.assignee.toLowerCase().includes('backend')
            );

            const failedBackendTasks = backendTasksInStory.filter(t =>
                failedInThisRun.has(t.task_id)
            );

            if (failedBackendTasks.length > 0) {
                const failedIds = failedBackendTasks.map(t => t.task_id).join(', ');
                return `Backend dependencies failed: ${failedIds}`;
            }
        }

        return null;
    };

    // Helper function to find tasks that depend on the current task
    const findDependentTasks = (task: any, allTasks: any[]): any[] => {
        if (!task.story_id) return [];

        const currentTaskIndex = allTasks.findIndex(t => t.task_id === task.task_id);

        // Find all later tasks in the same story
        return allTasks
            .slice(currentTaskIndex + 1)
            .filter(t => t.story_id === task.story_id);
    };

    const retryTask = async (task: any) => {
        setTaskStatuses(prev => ({ ...prev, [task.task_id]: 'loading' }));
        addLog(`🔄 Retrying ${task.task_id}...`);

        try {
            const endpoint = task.assignee.toLowerCase().includes('frontend')
                ? '/agent/frontend_dev/run'
                : '/agent/backend_dev/run';

            const context = {
                architecture,
                user_stories: userStories,
                prd
            };

            const response = await axios.post(`${API_BASE_URL}${endpoint}?session_id=${sessionId}`, {
                task,
                context
            });

            // Check if response contains an error
            if (response.data.error) {
                addLog(`❌ ${task.task_id} retry failed: ${response.data.error}`);
                if (response.data.suggestion) {
                    addLog(`💡 ${response.data.suggestion}`);
                }
                setTaskStatuses(prev => ({ ...prev, [task.task_id]: 'error' }));
            } else {
                setTaskStatuses(prev => ({ ...prev, [task.task_id]: 'complete' }));
                addLog(`✓ ${task.task_id} completed on retry.`);
            }
        } catch (e: any) {
            console.error(`Error retrying task ${task.task_id}:`, e);

            if (e.response?.status === 500) {
                addLog(`❌ ${task.task_id} retry failed: Server error`);
            } else if (!e.response) {
                addLog(`❌ ${task.task_id} retry failed: Network error`);
            } else {
                addLog(`❌ ${task.task_id} retry failed: ${e.message}`);
            }

            setTaskStatuses(prev => ({ ...prev, [task.task_id]: 'error' }));
        }
    };

    const fetchProjectFiles = async () => {
        if (!sessionId) return;
        try {
            const res = await axios.get(`${API_BASE_URL}/projects/${sessionId}`);
            if (res.data && res.data.files) {
                setProjectFiles(res.data.files);
                setShowCodeBrowser(true);
            }
        } catch (e) {
            console.error("Error fetching project files:", e);
        }
    };

    return (
        <div className="grid grid-cols-12 gap-8 h-[calc(100vh-8rem)]">
            {/* Left Column: Workflow */}
            <div className={`${logsCollapsed ? 'col-span-11' : 'col-span-8'} space-y-8 overflow-y-auto pr-4 pb-20 transition-all duration-300`}>

                {/* Header */}
                <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2">Mission Control</h2>
                    <p className="text-gray-500">Orchestrate your AI engineering team from a single command center.</p>
                </div>

                {/* Step 0: Initialization (Hero Section) */}
                {activeStep === 0 && (
                    <div className="relative overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-gradient-to-b from-[hsl(var(--card))] to-[hsl(var(--background))] shadow-2xl text-center space-y-8 max-w-3xl mx-auto mt-10 p-12">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
                            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700" />
                        </div>

                        <div className="relative z-10">
                            <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-500/30 transform hover:scale-105 transition-transform duration-300">
                                <Sparkles className="text-white w-12 h-12" />
                            </div>

                            <h3 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--foreground))] to-gray-500 mb-4">
                                Build the Future, Autonomously.
                            </h3>
                            <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
                                Initialize a new engineering session. Your AI squad is ready to strategize, design, and build your vision from zero to one.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto mt-10">
                                <div className="flex-1 relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
                                    <input
                                        type="text"
                                        placeholder="Project Name (e.g. Mars Colony OS)"
                                        className="relative w-full bg-[hsl(var(--card))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))] rounded-lg px-5 py-3.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && startSession()}
                                    />
                                </div>
                                <button
                                    onClick={startSession}
                                    disabled={loading}
                                    className="relative px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : <Play size={20} className="fill-current" />}
                                    <span>Initialize</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 1: Strategy */}
                <StepCard
                    title="Strategic Planning"
                    icon={Lightbulb}
                    isActive={activeStep === 1}
                    isComplete={activeStep > 1}
                    action={activeStep === 1 && selectedIdea && (
                        <button onClick={generatePRD} disabled={loading} className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2">
                            Approve Strategy & Generate PRD <ArrowRight size={18} />
                        </button>
                    )}
                >
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Describe your app idea (e.g. 'A marketplace for used spaceships')...."
                            className="flex-1 input-field"
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                        />
                        <button onClick={generateIdeas} disabled={loading} className="btn-secondary px-6 rounded-lg font-bold">
                            {loading ? <Loader2 className="animate-spin" /> : 'Brainstorm'}
                        </button>
                    </div>

                    {ideas && (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            {ideas.map((idea, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedIdea(idea)}
                                    className={`p-5 rounded-xl border cursor-pointer transition-all duration-200 group ${selectedIdea === idea
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                                        : 'border-[hsl(var(--border))] hover:border-gray-400 dark:hover:border-gray-600 bg-[hsl(var(--background))]'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-lg group-hover:text-blue-500 transition-colors">{idea.title}</h4>
                                        {selectedIdea === idea && <CheckCircle className="text-blue-500" size={18} />}
                                    </div>
                                    <p className="text-sm text-gray-500 leading-relaxed">{idea.pitch}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </StepCard>

                {/* Step 2: PRD */}
                <StepCard
                    title="Product Requirements"
                    icon={FileText}
                    isActive={activeStep === 2}
                    isComplete={activeStep > 2}
                    onRegenerate={() => generatePRD()}
                    action={activeStep === 2 && (
                        <button onClick={analyzePRD} disabled={loading} className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2">
                            Analyze Requirements <ArrowRight size={18} />
                        </button>
                    )}
                >
                    <MarkdownViewer content={prd || ''} title="Product Requirements Document" />
                </StepCard>

                {/* Step 3: Analysis */}
                <StepCard
                    title="Requirement Analysis"
                    icon={Search}
                    isActive={activeStep === 3}
                    isComplete={activeStep > 3}
                    onRegenerate={() => analyzePRD()}
                    action={activeStep === 3 && (
                        <button onClick={designArchitecture} disabled={loading} className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2">
                            Design Architecture <ArrowRight size={18} />
                        </button>
                    )}
                >
                    <div className="grid grid-cols-2 gap-4">
                        {userStories?.map((story, i) => (
                            <div key={i} className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-mono text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">{story.id}</span>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${story.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                                        }`}>{story.priority}</span>
                                </div>
                                <p className="font-medium text-sm">{story.title}</p>
                            </div>
                        ))}
                    </div>
                </StepCard>

                {/* Step 4: Architecture */}
                <StepCard
                    title="System Architecture"
                    icon={Cpu}
                    isActive={activeStep === 4}
                    isComplete={activeStep > 4}
                    onRegenerate={() => designArchitecture()}
                    action={activeStep === 4 && (
                        <button onClick={createSprintPlan} disabled={loading} className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2">
                            Create Sprint Plan <ArrowRight size={18} />
                        </button>
                    )}
                >
                    {architecture && (
                        <ArchitectureViewer data={architecture} />
                    )}
                </StepCard>

                {/* Step 5: Engineering */}
                <StepCard
                    title="Engineering Sprint"
                    icon={Code}
                    isActive={activeStep === 5}
                    isComplete={activeStep > 5}
                    onRegenerate={() => createSprintPlan()}
                >
                    <div className="space-y-6">
                        {/* Tab Navigation */}
                        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setSprintView('tasks')}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${sprintView === 'tasks'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                Task List
                            </button>
                            <button
                                onClick={() => setSprintView('storymap')}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${sprintView === 'storymap'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                Story Map
                            </button>
                        </div>

                        {/* Task List View */}
                        {sprintView === 'tasks' && (
                            <div className="space-y-3">
                                {(Array.isArray(sprintPlan) ? sprintPlan : (sprintPlan?.sprint_plan || [])).map((task: any, i: number) => {
                                    const status = taskStatuses[task.task_id] || 'pending';
                                    return (
                                        <div key={i} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${status === 'error' ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10' :
                                            status === 'complete' ? 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/10' :
                                                status === 'loading' ? 'border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10' :
                                                    'border-[hsl(var(--border))] bg-[hsl(var(--background))]'
                                            }`}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-mono text-gray-500">
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-sm">{task.title}</h5>
                                                    <span className="text-xs text-gray-500">{task.task_id}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs px-2 py-1 rounded bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300 border border-purple-100 dark:border-purple-800">
                                                    {task.assignee}
                                                </span>
                                                <StatusBadge status={status} />
                                                {/* Retry button for failed tasks */}
                                                {status === 'error' && (
                                                    <button
                                                        onClick={() => retryTask(task)}
                                                        className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-1.5 transition-colors"
                                                        title="Retry this task"
                                                    >
                                                        <RefreshCw size={12} />
                                                        Retry
                                                    </button>
                                                )}
                                                {/* Run button for pending tasks */}
                                                {status === 'pending' && Object.keys(taskStatuses).length > 0 && (
                                                    <button
                                                        onClick={() => retryTask(task)}
                                                        className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 transition-colors"
                                                        title="Run this task"
                                                    >
                                                        <Play size={12} />
                                                        Run
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Story Map View */}
                        {sprintView === 'storymap' && sessionId && (
                            <StoryMapViewer sessionId={sessionId} />
                        )}

                        {Object.values(taskStatuses).some(s => s === 'loading') && (
                            <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 flex items-center justify-center gap-3 text-blue-600 dark:text-blue-400">
                                <Loader2 className="animate-spin" />
                                <span className="font-medium">Agents are actively coding...</span>
                            </div>
                        )}

                        {Object.values(taskStatuses).every(s => s === 'complete') && Object.keys(taskStatuses).length > 0 && (
                            <div className="mt-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-800 flex items-center justify-center gap-3 text-green-600 dark:text-green-400">
                                <CheckCircle />
                                <span className="font-medium">Sprint successfully completed!</span>
                            </div>
                        )}

                        {/* Sprint Control Buttons */}
                        {Object.keys(taskStatuses).length === 0 && (Array.isArray(sprintPlan) ? sprintPlan : (sprintPlan?.sprint_plan || [])).length > 0 && (
                            <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800">
                                <button
                                    onClick={() => runSprint(false)}
                                    disabled={loading}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    <Play size={18} />
                                    Resume Sprint Execution
                                </button>
                            </div>
                        )}

                        {/* Resume Sprint Button - shows when there are incomplete tasks */}
                        {Object.keys(taskStatuses).length > 0 &&
                            !Object.values(taskStatuses).every(s => s === 'complete') &&
                            !Object.values(taskStatuses).some(s => s === 'loading') && (
                                <div className="mt-6 p-4 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800">
                                    <div className="mb-3 text-sm text-orange-700 dark:text-orange-300 text-center">
                                        {Object.values(taskStatuses).filter(s => s === 'error').length} failed, {' '}
                                        {Object.values(taskStatuses).filter(s => s === 'pending').length} pending
                                    </div>
                                    <button
                                        onClick={() => runSprint(true)}
                                        disabled={loading}
                                        className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        <RefreshCw size={18} />
                                        Resume Sprint (Continue from where it left off)
                                    </button>
                                </div>
                            )}


                        {/* Code Browser Button */}
                        {Object.values(taskStatuses).some(s => s === 'complete') && (
                            <div className="mt-6 pt-6 border-t border-[hsl(var(--border))]">
                                <button
                                    onClick={fetchProjectFiles}
                                    className="w-full py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Layout size={18} />
                                    {showCodeBrowser ? 'Refresh Project Files' : 'View & Debug Code'}
                                </button>
                            </div>
                        )}

                        {/* Code Viewer with Debugging */}
                        {showCodeBrowser && projectFiles.length > 0 && (
                            <div className="mt-6">
                                <CodeViewer
                                    sessionId={sessionId || ''}
                                    files={projectFiles}
                                    onRefresh={fetchProjectFiles}
                                />
                            </div>
                        )}

                        {/* Code Walkthrough Button */}
                        {Object.values(taskStatuses).some(s => s === 'complete') && (
                            <div className="mt-4">
                                <button
                                    onClick={() => setShowWalkthrough(!showWalkthrough)}
                                    className="w-full py-3 bg-purple-100 dark:bg-purple-900/20 hover:bg-purple-200 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-xl flex items-center justify-center gap-2 transition-colors font-semibold"
                                >
                                    <FileText size={18} />
                                    {showWalkthrough ? 'Hide Walkthrough Generator' : 'Generate Code Walkthrough'}
                                </button>
                            </div>
                        )}

                        {/* Code Walkthrough */}
                        {showWalkthrough && sessionId && (
                            <div className="mt-6">
                                <CodeWalkthrough sessionId={sessionId} />
                            </div>
                        )}
                    </div>
                </StepCard>

            </div>

            {/* Right Column: Logs */}
            <div className={`${logsCollapsed ? 'col-span-1' : 'col-span-4'} transition-all duration-300`}>
                <div className="sticky top-8 bg-[#0d1117] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col h-[calc(100vh-10rem)]">
                    <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#161b22]">
                        <div className="flex items-center gap-2 text-gray-400">
                            {!logsCollapsed && (
                                <>
                                    <Terminal size={16} />
                                    <span className="text-xs font-bold uppercase tracking-wider">System Logs</span>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {!logsCollapsed && (
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
                                </div>
                            )}
                            <button
                                onClick={toggleLogs}
                                className="p-1 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-white"
                                title={logsCollapsed ? "Expand logs" : "Collapse logs"}
                            >
                                {logsCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                            </button>
                        </div>
                    </div>
                    {!logsCollapsed && (
                        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-3">
                            {logs.length === 0 && (
                                <div className="text-gray-600 italic text-center mt-10">
                                    Waiting for system events...
                                </div>
                            )}
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
                                    <span className="text-gray-600 shrink-0">{log.split(']')[0]}]</span>
                                    <span className="text-green-400/90 break-words">{log.split(']')[1]}</span>
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    )}
                    {loading && (
                        <div className="p-2 bg-blue-500/10 border-t border-blue-500/20 text-blue-400 text-xs flex items-center justify-center gap-2">
                            <Loader2 size={10} className="animate-spin" /> Processing...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MissionControl;

