import { createContext, useContext, useState, type ReactNode } from 'react';

interface ProjectContextType {
    sessionId: string | null;
    projectName: string;
    keywords: string;
    ideas: any[];
    selectedIdea: any | null;
    prd: string | null;
    userStories: any[];
    architecture: any | null;
    uiDesign: any | null;
    sprintPlan: any | null;
    backendCode: any | null;
    frontendCode: any | null;
    qaReview: any | null;
    activeStep: number;

    setSessionId: (id: string | null) => void;
    setProjectName: (name: string) => void;
    setKeywords: (keywords: string) => void;
    setIdeas: (ideas: any[]) => void;
    setSelectedIdea: (idea: any | null) => void;
    setPrd: (prd: string | null) => void;
    setUserStories: (stories: any[]) => void;
    setArchitecture: (arch: any | null) => void;
    setUiDesign: (design: any | null) => void;
    setSprintPlan: (plan: any | null) => void;
    setBackendCode: (code: any | null) => void;
    setFrontendCode: (code: any | null) => void;
    setQaReview: (review: any | null) => void;
    setActiveStep: (step: number) => void;

    loadProject: (sessionId: string) => Promise<void>;
    resetProject: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within ProjectProvider');
    }
    return context;
};

interface ProjectProviderProps {
    children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
    // Initialize state from localStorage if available
    const [sessionId, setSessionIdState] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('currentProjectId');
        }
        return null;
    });
    const [projectName, setProjectName] = useState('');
    const [keywords, setKeywords] = useState('');
    const [ideas, setIdeas] = useState<any[]>([]);
    const [selectedIdea, setSelectedIdea] = useState<any | null>(null);
    const [prd, setPrd] = useState<string | null>(null);
    const [userStories, setUserStories] = useState<any[]>([]);
    const [architecture, setArchitecture] = useState<any | null>(null);
    const [uiDesign, setUiDesign] = useState<any | null>(null);
    const [sprintPlan, setSprintPlan] = useState<any | null>(null);
    const [backendCode, setBackendCode] = useState<any | null>(null);
    const [frontendCode, setFrontendCode] = useState<any | null>(null);
    const [qaReview, setQaReview] = useState<any | null>(null);
    const [activeStep, setActiveStep] = useState(0);

    // Wrapper for setSessionId that also updates localStorage
    const setSessionId = (id: string | null) => {
        setSessionIdState(id);
        if (typeof window !== 'undefined') {
            if (id) {
                localStorage.setItem('currentProjectId', id);
            } else {
                localStorage.removeItem('currentProjectId');
            }
        }
    };

    // Auto-load project on mount if sessionId exists
    // DISABLED: Causing race condition issues with ideas.map
    // Users should manually click project in sidebar to load
    // useEffect(() => {
    //     if (sessionId) {
    //         loadProject(sessionId).catch(console.error);
    //     }
    // }, []); // Only run on mount

    const loadProject = async (sessionId: string) => {
        try {
            const API_BASE_URL = 'http://localhost:8050';

            // Load all saved steps (including keywords)
            const steps = ['keywords', 'ideas', 'prd', 'user_stories', 'architecture', 'ui_design', 'sprint_plan', 'backend_code', 'frontend_code', 'qa_review'];

            let loadedKeywords: string = '';
            let loadedIdeas: any[] = [];
            let loadedPrd: string | null = null;
            let loadedUserStories: any[] = [];
            let loadedArchitecture: any | null = null;
            let loadedUiDesign: any | null = null;
            let loadedSprintPlan: any | null = null;
            let loadedBackendCode: any | null = null;
            let loadedFrontendCode: any | null = null;
            let loadedQaReview: any | null = null;

            for (const step of steps) {
                try {
                    const res = await fetch(`${API_BASE_URL}/projects/${sessionId}/${step}`);
                    if (res.ok) {
                        const data = await res.json();

                        switch (step) {
                            case 'keywords':
                                // Load saved keywords
                                if (data.data && typeof data.data === 'object' && 'keywords' in data.data) {
                                    loadedKeywords = data.data.keywords;
                                    setKeywords(loadedKeywords);
                                } else if (typeof data.data === 'string') {
                                    loadedKeywords = data.data;
                                    setKeywords(loadedKeywords);
                                }
                                break;
                            case 'ideas':
                                // Ensure it's an array
                                loadedIdeas = Array.isArray(data.data) ? data.data : [];
                                setIdeas(loadedIdeas);
                                // Set the first idea as selected if ideas exist
                                if (loadedIdeas.length > 0) {
                                    setSelectedIdea(loadedIdeas[0]);
                                    // Only extract keywords if they weren't already loaded
                                    if (!loadedKeywords) {
                                        const firstIdea = loadedIdeas[0];
                                        const extractedKeywords = firstIdea.pitch || firstIdea.title || '';
                                        setKeywords(extractedKeywords);
                                    }
                                }
                                break;
                            case 'prd':
                                loadedPrd = data.data;
                                setPrd(loadedPrd);
                                break;
                            case 'user_stories':
                                // Ensure it's an array
                                loadedUserStories = Array.isArray(data.data) ? data.data : [];
                                setUserStories(loadedUserStories);
                                break;
                            case 'architecture':
                                loadedArchitecture = data.data;
                                setArchitecture(loadedArchitecture);
                                break;
                            case 'ui_design':
                                loadedUiDesign = data.data;
                                setUiDesign(loadedUiDesign);
                                break;
                            case 'sprint_plan':
                                loadedSprintPlan = data.data;
                                setSprintPlan(loadedSprintPlan);
                                break;
                            case 'backend_code':
                                loadedBackendCode = data.data;
                                setBackendCode(loadedBackendCode);
                                break;
                            case 'frontend_code':
                                loadedFrontendCode = data.data;
                                setFrontendCode(loadedFrontendCode);
                                break;
                            case 'qa_review':
                                loadedQaReview = data.data;
                                setQaReview(loadedQaReview);
                                break;
                        }
                    }
                    // Silently skip if step doesn't exist (404)
                } catch (e) {
                    // Silently skip errors for individual steps
                    console.warn(`Failed to load step ${step}:`, e);
                }
            }

            setSessionId(sessionId);

            // Determine active step based on what's loaded
            if (loadedQaReview) setActiveStep(8);
            else if (loadedFrontendCode || loadedBackendCode) setActiveStep(7);
            else if (loadedSprintPlan) setActiveStep(6);
            else if (loadedUiDesign) setActiveStep(5);
            else if (loadedArchitecture) setActiveStep(4);
            else if (loadedUserStories.length > 0) setActiveStep(3);
            else if (loadedPrd) setActiveStep(2);
            else if (loadedIdeas.length > 0) setActiveStep(1);

        } catch (error) {
            console.error('Failed to load project:', error);
            throw error; // Re-throw so the UI can show an error
        }
    };

    const resetProject = () => {
        setSessionId(null);
        setProjectName('');
        setKeywords('');
        setIdeas([]);
        setSelectedIdea(null);
        setPrd(null);
        setUserStories([]);
        setArchitecture(null);
        setUiDesign(null);
        setSprintPlan(null);
        setBackendCode(null);
        setFrontendCode(null);
        setQaReview(null);
        setActiveStep(0);
    };

    const value = {
        sessionId,
        projectName,
        keywords,
        ideas,
        selectedIdea,
        prd,
        userStories,
        architecture,
        uiDesign,
        sprintPlan,
        backendCode,
        frontendCode,
        qaReview,
        activeStep,

        setSessionId,
        setProjectName,
        setKeywords,
        setIdeas,
        setSelectedIdea,
        setPrd,
        setUserStories,
        setArchitecture,
        setUiDesign,
        setSprintPlan,
        setBackendCode,
        setFrontendCode,
        setQaReview,
        setActiveStep,

        loadProject,
        resetProject,
    };

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
};
