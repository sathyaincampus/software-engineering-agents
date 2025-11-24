import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
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
    Server
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

const StatusBadge = ({ status }: { status: 'pending' | 'loading' | 'complete' | 'active' }) => {
    const styles = {
        pending: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
        loading: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800 animate-pulse',
        active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700',
        complete: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800',
    };

    const icons = {
        pending: <div className="w-2 h-2 rounded-full bg-gray-400" />,
        loading: <Loader2 size={12} className="animate-spin" />,
        active: <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />,
        complete: <CheckCircle size={12} />,
    };

    return (
        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
            {icons[status]}
            <span className="capitalize">{status}</span>
        </div>
    );
};

const StepCard = ({ title, icon: Icon, isActive, isComplete, children, action }: any) => {
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
                    <StatusBadge status={isActive ? 'active' : 'complete'} />
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
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Data
    const [keywords, setKeywords] = useState('');
    const [ideas, setIdeas] = useState<Idea[] | null>(null);
    const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
    const [prd, setPrd] = useState<string | null>(null);
    const [userStories, setUserStories] = useState<UserStory[] | null>(null);
    const [architecture, setArchitecture] = useState<Architecture | null>(null);
    const [sprintPlan, setSprintPlan] = useState<SprintPlan | null>(null);

    // --- Helpers ---
    const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    // --- API Calls ---
    const startSession = async () => {
        if (!projectName) return;
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/session/start`, { project_name: projectName });
            setSessionId(res.data.session_id);
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
            setSprintPlan(res.data);
            addLog("Sprint Plan ready.");
            setActiveStep(5);
        } catch (e) { console.error(e); addLog("Error creating sprint plan"); }
        finally { setLoading(false); }
    };

    return (
        <div className="grid grid-cols-12 gap-8 h-[calc(100vh-8rem)]">
            {/* Left Column: Workflow */}
            <div className="col-span-8 space-y-8 overflow-y-auto pr-4 pb-20">

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
                            placeholder="Describe your app idea (e.g. 'A marketplace for used spaceships')..."
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
                    action={activeStep === 2 && (
                        <button onClick={analyzePRD} disabled={loading} className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2">
                            Analyze Requirements <ArrowRight size={18} />
                        </button>
                    )}
                >
                    <div className="bg-gray-50 dark:bg-gray-950 p-6 rounded-xl border border-[hsl(var(--border))] font-mono text-sm overflow-y-auto max-h-96 shadow-inner">
                        <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{prd}</pre>
                    </div>
                </StepCard>

                {/* Step 3: Analysis */}
                <StepCard
                    title="Requirement Analysis"
                    icon={Search}
                    isActive={activeStep === 3}
                    isComplete={activeStep > 3}
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
                    action={activeStep === 4 && (
                        <button onClick={createSprintPlan} disabled={loading} className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2">
                            Create Sprint Plan <ArrowRight size={18} />
                        </button>
                    )}
                >
                    {architecture && (
                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-5 rounded-xl border border-[hsl(var(--border))] bg-gray-50 dark:bg-gray-900/50">
                                <h4 className="font-bold mb-4 flex items-center gap-2"><Layout size={16} /> Frontend</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-500">Framework</span> <span className="font-medium">{architecture.stack?.frontend}</span></div>
                                </div>
                            </div>
                            <div className="p-5 rounded-xl border border-[hsl(var(--border))] bg-gray-50 dark:bg-gray-900/50">
                                <h4 className="font-bold mb-4 flex items-center gap-2"><Server size={16} /> Backend</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-500">Language</span> <span className="font-medium">{architecture.stack?.backend}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Database</span> <span className="font-medium">{architecture.stack?.database}</span></div>
                                </div>
                            </div>
                        </div>
                    )}
                </StepCard>

                {/* Step 5: Engineering */}
                <StepCard
                    title="Engineering Sprint"
                    icon={Code}
                    isActive={activeStep === 5}
                    isComplete={activeStep > 5}
                >
                    <div className="space-y-3">
                        {sprintPlan?.sprint_plan?.map((task: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))]">
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
                                    <StatusBadge status="loading" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 flex items-center justify-center gap-3 text-blue-600 dark:text-blue-400">
                        <Loader2 className="animate-spin" />
                        <span className="font-medium">Agents are actively coding...</span>
                    </div>
                </StepCard>

            </div>

            {/* Right Column: Logs */}
            <div className="col-span-4">
                <div className="sticky top-8 bg-[#0d1117] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col h-[calc(100vh-10rem)]">
                    <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#161b22]">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Terminal size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">System Logs</span>
                        </div>
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
                        </div>
                    </div>
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
