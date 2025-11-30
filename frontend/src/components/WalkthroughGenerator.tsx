import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Image, Video, Eye, Loader2, ChevronDown, ChevronRight, Copy, Check, Maximize2, X } from 'lucide-react';
import axios from 'axios';
import mermaid from 'mermaid';

interface WalkthroughGeneratorProps {
    sessionId: string;
    onClose?: () => void;
}

type WalkthroughType = 'text' | 'image' | 'video';
type ViewMode = 'generate' | 'view';

const WalkthroughGenerator: React.FC<WalkthroughGeneratorProps> = ({ sessionId }) => {
    const [selectedType, setSelectedType] = useState<WalkthroughType>('text');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('generate');
    const [activeViewTab, setActiveViewTab] = useState<WalkthroughType>('text');

    // Store all three walkthroughs
    const [walkthroughs, setWalkthroughs] = useState<{
        text: any | null;
        image: any | null;
        video: any | null;
    }>({
        text: null,
        image: null,
        video: null
    });

    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    const [copiedDiagram, setCopiedDiagram] = useState<string | null>(null);
    const [zoomedDiagram, setZoomedDiagram] = useState<{ sectionId: string, diagramIndex: number } | null>(null);

    const API_BASE_URL = 'http://localhost:8050';

    // Initialize mermaid - fit diagrams by default
    useEffect(() => {
        const isDarkMode = document.documentElement.classList.contains('dark');

        mermaid.initialize({
            startOnLoad: true,
            theme: isDarkMode ? 'dark' : 'default',
            securityLevel: 'loose',
            flowchart: { useMaxWidth: true },
            er: { useMaxWidth: true },
            sequence: { useMaxWidth: true },
            themeVariables: isDarkMode ? {} : {
                primaryColor: '#3b82f6',
                primaryTextColor: '#1f2937',
                primaryBorderColor: '#60a5fa',
                lineColor: '#6b7280',
                secondaryColor: '#10b981',
                tertiaryColor: '#f59e0b',
                background: '#ffffff',
                mainBkg: '#ffffff',
                secondBkg: '#f3f4f6',
                tertiaryBkg: '#e5e7eb',
                textColor: '#1f2937',
                border1: '#d1d5db',
                border2: '#9ca3af'
            }
        });
    }, []);

    // Load existing walkthroughs on mount
    useEffect(() => {
        loadExistingWalkthroughs();
    }, [sessionId]);

    // Render mermaid diagrams when walkthrough changes or zoom modal opens
    useEffect(() => {
        if (viewMode === 'view' || zoomedDiagram) {
            setTimeout(() => {
                mermaid.contentLoaded();
            }, 100);
        }
    }, [viewMode, activeViewTab, expandedSections, zoomedDiagram]);

    const loadExistingWalkthroughs = async () => {
        const types: WalkthroughType[] = ['text', 'image', 'video'];

        for (const type of types) {
            try {
                // Use the generic project step endpoint
                const response = await axios.get(
                    `${API_BASE_URL}/projects/${sessionId}/walkthrough_${type}`
                );
                // Response structure is { step: "walkthrough_text", data: {...} }
                if (response.data?.data) {
                    setWalkthroughs(prev => ({ ...prev, [type]: response.data.data }));
                }
            } catch (err) {
                // Walkthrough doesn't exist yet, that's ok
                console.log(`No ${type} walkthrough found yet`);
            }
        }
    };

    const generateWalkthrough = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(
                `${API_BASE_URL}/agent/walkthrough/generate?session_id=${sessionId}&type=${selectedType}`
            );

            setWalkthroughs(prev => ({ ...prev, [selectedType]: response.data }));
            setActiveViewTab(selectedType);
            setViewMode('view');
        } catch (err: any) {
            console.error('Failed to generate walkthrough:', err);
            setError(err.response?.data?.detail || 'Failed to generate walkthrough');
        } finally {
            setLoading(false);
        }
    };

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            } else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    };

    const copyDiagram = async (diagram: string, index: number) => {
        await navigator.clipboard.writeText(diagram);
        setCopiedDiagram(`${index}`);
        setTimeout(() => setCopiedDiagram(null), 2000);
    };

    const walkthroughTypes = [
        {
            type: 'text' as WalkthroughType,
            icon: FileText,
            title: 'Text-Based',
            description: 'Markdown documentation'
        },
        {
            type: 'image' as WalkthroughType,
            icon: Image,
            title: 'Image-Based',
            description: 'Visual diagrams'
        },
        {
            type: 'video' as WalkthroughType,
            icon: Video,
            title: 'Video-Based',
            description: 'Animated explanation'
        }
    ];

    const currentWalkthrough = walkthroughs[activeViewTab];
    const hasAnyWalkthrough = walkthroughs.text || walkthroughs.image || walkthroughs.video;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">Code Walkthrough Generator</h2>
                <p className="text-purple-100">
                    Generate comprehensive documentation and walkthroughs for your generated code
                </p>
            </div>

            {/* Mode Toggle */}
            {hasAnyWalkthrough && (
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('generate')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'generate'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        Generate New
                    </button>
                    <button
                        onClick={() => setViewMode('view')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'view'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        View Existing
                    </button>
                </div>
            )}

            {viewMode === 'generate' ? (
                <>
                    {/* Type Selection */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Select Walkthrough Type</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {walkthroughTypes.map(({ type, icon: Icon, title, description }) => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedType(type)}
                                    className={`p-6 rounded-xl border-2 transition-all ${selectedType === type
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                >
                                    <Icon
                                        size={40}
                                        className={`mx-auto mb-3 ${selectedType === type
                                            ? 'text-blue-500'
                                            : 'text-gray-400'
                                            }`}
                                    />
                                    <h4 className="font-semibold mb-1">{title}</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {description}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={generateWalkthrough}
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Generating Walkthrough...
                            </>
                        ) : (
                            <>
                                <Eye size={20} />
                                Generate Walkthrough
                            </>
                        )}
                    </button>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                            {error}
                        </div>
                    )}
                </>
            ) : (
                <>
                    {/* View Tabs */}
                    <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                        {walkthroughTypes.map(({ type, icon: Icon, title }) => {
                            const hasWalkthrough = walkthroughs[type];
                            return (
                                <button
                                    key={type}
                                    onClick={() => setActiveViewTab(type)}
                                    disabled={!hasWalkthrough}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeViewTab === type
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : hasWalkthrough
                                            ? 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                            : 'border-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                        }`}
                                >
                                    <Icon size={16} />
                                    {title}
                                    {!hasWalkthrough && <span className="text-xs">(Not generated)</span>}
                                </button>
                            );
                        })}
                    </div>

                    {/* Walkthrough Display */}
                    {currentWalkthrough ? (
                        <WalkthroughViewer
                            walkthrough={currentWalkthrough}
                            type={activeViewTab}
                            expandedSections={expandedSections}
                            toggleSection={toggleSection}
                            copyDiagram={copyDiagram}
                            copiedDiagram={copiedDiagram}
                            setZoomedDiagram={setZoomedDiagram}
                        />
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            <p>No {activeViewTab} walkthrough generated yet.</p>
                            <button
                                onClick={() => {
                                    setSelectedType(activeViewTab);
                                    setViewMode('generate');
                                }}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Generate {activeViewTab} walkthrough
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Zoom Modal - Portal to document.body for true fullscreen */}
            {zoomedDiagram && currentWalkthrough && createPortal(
                <div
                    className="fixed inset-0 bg-black/90 flex items-center justify-center p-4"
                    style={{ zIndex: 9999 }}
                    onClick={() => setZoomedDiagram(null)}
                >
                    <div
                        className="relative w-full h-full max-w-7xl bg-gray-900 rounded-2xl overflow-auto flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setZoomedDiagram(null)}
                            className="absolute top-4 right-4 p-3 bg-red-500 hover:bg-red-600 text-white rounded-lg z-10 shadow-lg"
                            title="Close (ESC)"
                        >
                            <X size={20} />
                        </button>
                        <div className="p-8 flex-1 overflow-auto">
                            <h2 className="text-2xl font-bold mb-6 text-white">
                                Diagram {zoomedDiagram.diagramIndex + 1}
                            </h2>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl">
                                <div className="mermaid">
                                    {currentWalkthrough.sections?.find((s: any) => (s.section_id || `section-${currentWalkthrough.sections.indexOf(s)}`) === zoomedDiagram.sectionId)?.diagrams?.[zoomedDiagram.diagramIndex]}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

const WalkthroughViewer: React.FC<{
    walkthrough: any;
    type: WalkthroughType;
    expandedSections: Set<string>;
    toggleSection: (id: string) => void;
    copyDiagram: (diagram: string, index: number) => void;
    copiedDiagram: string | null;
    setZoomedDiagram: (value: { sectionId: string, diagramIndex: number } | null) => void;
}> = ({ walkthrough, type, expandedSections, toggleSection, copyDiagram, copiedDiagram, setZoomedDiagram }) => {

    // Info banners for each type
    const getInfoBanner = () => {
        switch (type) {
            case 'text':
                return (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
                        <p className="text-blue-800 dark:text-blue-200">
                            📄 <strong>Text Documentation</strong> - Read through the documentation, copy code snippets, and view rendered Mermaid diagrams.
                        </p>
                    </div>
                );
            case 'image':
                return (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm">
                        <p className="text-green-800 dark:text-green-200">
                            🖼️ <strong>Visual Diagrams</strong> - Mermaid diagrams are rendered as graphics. Use the Copy button to copy diagram code, or take screenshots for presentations.
                        </p>
                    </div>
                );
            case 'video':
                return (
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg text-sm">
                        <p className="text-purple-800 dark:text-purple-200">
                            🎥 <strong>Video Script</strong> - Use this script with your favorite video generator (Synthesia, D-ID, Loom) or record manually following the voiceover and visual cues.
                        </p>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-4">
            {/* Info Banner */}
            {getInfoBanner()}

            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{walkthrough.title}</h3>
                <span className="text-sm text-gray-500">
                    {walkthrough.estimated_reading_time || walkthrough.estimated_total_time || 'N/A'}
                </span>
            </div>

            {/* Overview */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold mb-2">Overview</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {walkthrough.overview}
                </p>
            </div>

            {/* Sections */}
            <div className="space-y-3">
                <h4 className="font-semibold">Sections</h4>
                {walkthrough.sections?.map((section: any, index: number) => {
                    const sectionId = section.section_id || `section-${index}`;
                    const isExpanded = expandedSections.has(sectionId);

                    return (
                        <div
                            key={sectionId}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                        >
                            <button
                                onClick={() => toggleSection(sectionId)}
                                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                    <span className="font-medium">{section.title}</span>
                                    {section.duration && (
                                        <span className="text-sm text-gray-500">
                                            ({section.duration})
                                        </span>
                                    )}
                                    {section.timestamp && (
                                        <span className="text-sm text-gray-500">
                                            ({section.timestamp})
                                        </span>
                                    )}
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                                    {/* Content */}
                                    {section.content && (
                                        <div className="prose dark:prose-invert max-w-none">
                                            <p className="text-sm whitespace-pre-wrap">{section.content}</p>
                                        </div>
                                    )}

                                    {/* Voiceover (for video type) */}
                                    {section.voiceover && (
                                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                            <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                                <Video size={16} />
                                                Voiceover Script
                                            </h5>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                                                "{section.voiceover}"
                                            </p>
                                        </div>
                                    )}

                                    {/* Visual Cues (for video type) */}
                                    {section.visual_cues && Array.isArray(section.visual_cues) && section.visual_cues.length > 0 && (
                                        <div>
                                            <h5 className="text-sm font-semibold mb-2">Visual Cues</h5>
                                            <ul className="list-disc list-inside text-sm space-y-1">
                                                {section.visual_cues.map((cue: string, idx: number) => (
                                                    <li key={idx} className="text-gray-600 dark:text-gray-400">
                                                        {cue}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Diagrams */}
                                    {section.diagrams && section.diagrams.length > 0 && (
                                        <div className="space-y-3">
                                            <h5 className="text-sm font-semibold">Diagrams</h5>
                                            {section.diagrams.map((diagram: string, idx: number) => (
                                                <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                                    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                                        <span className="text-xs text-gray-500">Diagram {idx + 1}</span>
                                                        <button
                                                            onClick={() => copyDiagram(diagram, idx)}
                                                            className="flex items-center gap-1 px-2 py-1 text-xs bg-white dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                                                        >
                                                            {copiedDiagram === `${idx}` ? (
                                                                <>
                                                                    <Check size={12} />
                                                                    Copied!
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy size={12} />
                                                                    Copy
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                    <div className="p-4 bg-white dark:bg-gray-900 relative group">
                                                        <button
                                                            onClick={() => setZoomedDiagram({ sectionId, diagramIndex: idx })}
                                                            className="absolute top-4 right-4 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                            title="Expand diagram"
                                                        >
                                                            <Maximize2 size={16} />
                                                        </button>
                                                        <div className="mermaid">
                                                            {diagram}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Code Snippets */}
                                    {section.code_snippets && section.code_snippets.length > 0 && (
                                        <div className="space-y-3">
                                            <h5 className="text-sm font-semibold">Code Examples</h5>
                                            {section.code_snippets.map((snippet: any, idx: number) => (
                                                <div key={idx} className="space-y-2">
                                                    <div className="text-xs text-gray-500 font-mono">
                                                        {snippet.file}
                                                    </div>
                                                    <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-x-auto">
                                                        <code>{snippet.code}</code>
                                                    </pre>
                                                    {snippet.explanation && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {snippet.explanation}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Setup Instructions */}
            {walkthrough.setup_instructions && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="font-semibold mb-3">Setup Instructions</h4>

                    {walkthrough.setup_instructions.prerequisites && (
                        <div className="mb-3">
                            <h5 className="text-sm font-semibold mb-1">Prerequisites</h5>
                            <ul className="list-disc list-inside text-sm">
                                {walkthrough.setup_instructions.prerequisites.map((prereq: string, idx: number) => (
                                    <li key={idx}>{prereq}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {walkthrough.setup_instructions.installation_steps && (
                        <div>
                            <h5 className="text-sm font-semibold mb-1">Installation Steps</h5>
                            <ol className="list-decimal list-inside text-sm space-y-1">
                                {walkthrough.setup_instructions.installation_steps.map((step: string, idx: number) => (
                                    <li key={idx}>{step}</li>
                                ))}
                            </ol>
                        </div>
                    )}
                </div>
            )}

            {/* Key Concepts */}
            {walkthrough.key_concepts && walkthrough.key_concepts.length > 0 && (
                <div>
                    <h4 className="font-semibold mb-3">Key Concepts</h4>
                    <div className="grid grid-cols-2 gap-3">
                        {walkthrough.key_concepts.map((concept: any, idx: number) => (
                            <div
                                key={idx}
                                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                            >
                                <h5 className="font-semibold text-sm mb-1">{concept.concept}</h5>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {concept.explanation}
                                </p>
                                {concept.examples && concept.examples.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {concept.examples.map((example: string, exIdx: number) => (
                                            <span
                                                key={exIdx}
                                                className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono"
                                            >
                                                {example}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WalkthroughGenerator;
