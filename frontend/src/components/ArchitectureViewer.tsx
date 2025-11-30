import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import mermaid from 'mermaid';
import { Server, Database, Cloud, Code, Copy, Check, Maximize2, X } from 'lucide-react';

interface TechStack {
    frontend?: any;
    backend?: any;
    database?: any;
    devops?: any;
}

interface SystemDiagram {
    format?: string;
    code?: string;
}

interface ArchitectureData {
    tech_stack?: TechStack;
    system_diagram?: SystemDiagram;
    backend_diagram?: SystemDiagram;
    frontend_diagram?: SystemDiagram;
    sequence_diagram?: SystemDiagram;
    api_design_principles?: any[];
    data_model?: any;
}

interface ArchitectureViewerProps {
    data: ArchitectureData;
}

const ArchitectureViewer: React.FC<ArchitectureViewerProps> = ({ data }) => {
    const [copied, setCopied] = useState(false);
    const [copiedSequence, setCopiedSequence] = useState(false);
    const [copiedBackend, setCopiedBackend] = useState(false);
    const [copiedFrontend, setCopiedFrontend] = useState(false);
    const [zoomedDiagram, setZoomedDiagram] = useState<'system' | 'backend' | 'frontend' | 'sequence' | null>(null);
    const [systemError, setSystemError] = useState<string | null>(null);
    const [backendError, setBackendError] = useState<string | null>(null);
    const [frontendError, setFrontendError] = useState<string | null>(null);
    const [sequenceError, setSequenceError] = useState<string | null>(null);
    const systemDiagramRef = useRef<HTMLDivElement>(null);
    const backendDiagramRef = useRef<HTMLDivElement>(null);
    const frontendDiagramRef = useRef<HTMLDivElement>(null);
    const sequenceDiagramRef = useRef<HTMLDivElement>(null);
    const zoomSystemRef = useRef<HTMLDivElement>(null);
    const zoomBackendRef = useRef<HTMLDivElement>(null);
    const zoomFrontendRef = useRef<HTMLDivElement>(null);
    const zoomSequenceRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            securityLevel: 'loose',
        });
    }, []);

    useEffect(() => {
        let isMounted = true;

        const renderDiagrams = async () => {
            // Small delay to ensure DOM refs are attached
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!isMounted) return;

            // Render system diagram
            if (data.system_diagram?.code && systemDiagramRef.current) {
                try {
                    // Clear previous content
                    systemDiagramRef.current.innerHTML = '';
                    const id = `system-diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    const { svg } = await mermaid.render(id, data.system_diagram.code);
                    if (isMounted && systemDiagramRef.current) {
                        systemDiagramRef.current.innerHTML = svg;
                        setSystemError(null);
                    }
                } catch (e: any) {
                    console.error('Mermaid rendering error:', e);
                    if (isMounted) {
                        setSystemError(e.message || 'Failed to render diagram');
                    }
                }
            }

            // Render backend diagram
            if (data.backend_diagram?.code && backendDiagramRef.current) {
                try {
                    backendDiagramRef.current.innerHTML = '';
                    const id = `backend-diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    const { svg } = await mermaid.render(id, data.backend_diagram.code);
                    if (isMounted && backendDiagramRef.current) {
                        backendDiagramRef.current.innerHTML = svg;
                        setBackendError(null);
                    }
                } catch (e: any) {
                    console.error('Mermaid rendering error:', e);
                    if (isMounted) {
                        setBackendError(e.message || 'Failed to render diagram');
                    }
                }
            }

            // Render frontend diagram
            if (data.frontend_diagram?.code && frontendDiagramRef.current) {
                try {
                    frontendDiagramRef.current.innerHTML = '';
                    const id = `frontend-diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    const { svg } = await mermaid.render(id, data.frontend_diagram.code);
                    if (isMounted && frontendDiagramRef.current) {
                        frontendDiagramRef.current.innerHTML = svg;
                        setFrontendError(null);
                    }
                } catch (e: any) {
                    console.error('Mermaid rendering error:', e);
                    if (isMounted) {
                        setFrontendError(e.message || 'Failed to render diagram');
                    }
                }
            }

            // Render sequence diagram
            if (data.sequence_diagram?.code && sequenceDiagramRef.current) {
                try {
                    // Clear previous content
                    sequenceDiagramRef.current.innerHTML = '';
                    const id = `sequence-diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    const { svg } = await mermaid.render(id, data.sequence_diagram.code);
                    if (isMounted && sequenceDiagramRef.current) {
                        sequenceDiagramRef.current.innerHTML = svg;
                        setSequenceError(null);
                    }
                } catch (e: any) {
                    console.error('Mermaid rendering error:', e);
                    if (isMounted) {
                        setSequenceError(e.message || 'Failed to render diagram');
                    }
                }
            }
        };

        renderDiagrams();

        return () => {
            isMounted = false;
        };
    }, [data.system_diagram, data.sequence_diagram]);

    useEffect(() => {
        const renderZoomedDiagram = async () => {
            try {
                if (zoomedDiagram === 'system' && data.system_diagram?.code && zoomSystemRef.current) {
                    const id = `zoom-system-${Date.now()}`;
                    const { svg } = await mermaid.render(id, data.system_diagram.code);
                    zoomSystemRef.current.innerHTML = svg;
                } else if (zoomedDiagram === 'backend' && data.backend_diagram?.code && zoomBackendRef.current) {
                    const id = `zoom-backend-${Date.now()}`;
                    const { svg } = await mermaid.render(id, data.backend_diagram.code);
                    zoomBackendRef.current.innerHTML = svg;
                } else if (zoomedDiagram === 'frontend' && data.frontend_diagram?.code && zoomFrontendRef.current) {
                    const id = `zoom-frontend-${Date.now()}`;
                    const { svg } = await mermaid.render(id, data.frontend_diagram.code);
                    zoomFrontendRef.current.innerHTML = svg;
                } else if (zoomedDiagram === 'sequence' && data.sequence_diagram?.code && zoomSequenceRef.current) {
                    const id = `zoom-sequence-${Date.now()}`;
                    const { svg } = await mermaid.render(id, data.sequence_diagram.code);
                    zoomSequenceRef.current.innerHTML = svg;
                }
            } catch (e) {
                console.error('Mermaid zoom rendering error:', e);
            }
        };

        if (zoomedDiagram) {
            renderZoomedDiagram();
        }
    }, [zoomedDiagram, data.system_diagram, data.backend_diagram, data.frontend_diagram, data.sequence_diagram]);

    const copyMermaidCode = () => {
        if (data.system_diagram?.code) {
            navigator.clipboard.writeText(data.system_diagram.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const copyBackendDiagram = () => {
        if (data.backend_diagram?.code) {
            navigator.clipboard.writeText(data.backend_diagram.code);
            setCopiedBackend(true);
            setTimeout(() => setCopiedBackend(false), 2000);
        }
    };

    const copyFrontendDiagram = () => {
        if (data.frontend_diagram?.code) {
            navigator.clipboard.writeText(data.frontend_diagram.code);
            setCopiedFrontend(true);
            setTimeout(() => setCopiedFrontend(false), 2000);
        }
    };

    const copySequenceDiagram = () => {
        if (data.sequence_diagram?.code) {
            navigator.clipboard.writeText(data.sequence_diagram.code);
            setCopiedSequence(true);
            setTimeout(() => setCopiedSequence(false), 2000);
        }
    };

    const renderTechStack = () => {
        if (!data.tech_stack) return null;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Frontend */}
                {data.tech_stack.frontend && (
                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Code className="text-blue-400" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-blue-400">Frontend</h3>
                        </div>
                        <div className="space-y-3">
                            {Object.entries(data.tech_stack.frontend).map(([key, value]) => (
                                <div key={key} className="flex flex-col gap-1">
                                    <span className="text-gray-400 text-sm uppercase tracking-wide">{key.replace(/_/g, ' ')}</span>
                                    <span className="text-white font-semibold text-lg">{String(value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Backend */}
                {data.tech_stack.backend && (
                    <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                                <Server className="text-green-400" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-green-400">Backend</h3>
                        </div>
                        <div className="space-y-3">
                            {Object.entries(data.tech_stack.backend).map(([key, value]) => (
                                <div key={key} className="flex flex-col gap-1">
                                    <span className="text-gray-400 text-sm uppercase tracking-wide">{key.replace(/_/g, ' ')}</span>
                                    <span className="text-white font-semibold text-lg">{String(value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Database */}
                {data.tech_stack.database && (
                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <Database className="text-purple-400" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-purple-400">Database</h3>
                        </div>
                        <div className="space-y-3">
                            {Object.entries(data.tech_stack.database).map(([key, value]) => (
                                <div key={key} className="flex flex-col gap-1">
                                    <span className="text-gray-400 text-sm uppercase tracking-wide">{key.replace(/_/g, ' ')}</span>
                                    <span className="text-white font-semibold text-lg">{String(value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* DevOps */}
                {data.tech_stack.devops && (
                    <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-orange-500/20 rounded-lg">
                                <Cloud className="text-orange-400" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-orange-400">DevOps</h3>
                        </div>
                        <div className="space-y-3">
                            {Object.entries(data.tech_stack.devops).map(([key, value]) => (
                                <div key={key} className="flex flex-col gap-1">
                                    <span className="text-gray-400 text-sm uppercase tracking-wide">{key.replace(/_/g, ' ')}</span>
                                    <span className="text-white font-semibold text-lg">{String(value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderDatabaseSchema = () => {
        if (!data.data_model?.schema) return null;

        return (
            <div className="mb-8">
                <h3 className="text-2xl font-bold mb-4">Database Schema</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {data.data_model.schema.map((table: any, idx: number) => (
                        <div key={idx} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                            <h4 className="text-lg font-bold text-blue-400 mb-3">{table.table}</h4>
                            <div className="space-y-1 text-sm font-mono">
                                {table.columns?.map((col: any, colIdx: number) => (
                                    <div key={colIdx} className="flex items-center gap-2 text-gray-300">
                                        <span className={col.primary_key ? 'text-yellow-400' : 'text-gray-500'}>
                                            {col.primary_key ? '🔑' : '  '}
                                        </span>
                                        <span className="text-green-400">{col.name}</span>
                                        <span className="text-gray-500">:</span>
                                        <span className="text-purple-400">{col.type}</span>
                                        {col.not_null && <span className="text-red-400 text-xs">NOT NULL</span>}
                                        {col.unique && <span className="text-blue-400 text-xs">UNIQUE</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Tech Stack */}
            <div>
                <h2 className="text-3xl font-bold mb-6">Technology Stack</h2>
                {renderTechStack()}
            </div>

            {/* System Architecture Diagram */}
            {data.system_diagram?.code && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-3xl font-bold">System Architecture Diagram</h2>
                        <button
                            onClick={copyMermaidCode}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? 'Copied!' : 'Copy Mermaid Code'}
                        </button>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto relative group">
                        <button
                            onClick={() => setZoomedDiagram('system')}
                            className="absolute top-4 right-4 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            title="Zoom diagram"
                        >
                            <Maximize2 size={16} />
                        </button>
                        <div ref={systemDiagramRef} className="mermaid-container" />
                        {systemError && (
                            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                                <p className="text-red-400 font-semibold mb-2">⚠️ Diagram Rendering Error:</p>
                                <p className="text-red-300 text-sm mb-3">{systemError}</p>
                                <details className="text-xs">
                                    <summary className="cursor-pointer text-gray-400 hover:text-white">Show Raw Mermaid Code</summary>
                                    <pre className="mt-2 p-3 bg-black/50 rounded overflow-x-auto text-gray-300">
                                        {data.system_diagram?.code}
                                    </pre>
                                </details>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Backend Processing Architecture */}
            {data.backend_diagram?.code && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-3xl font-bold">Backend Processing Architecture</h2>
                        <button
                            onClick={copyBackendDiagram}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
                        >
                            {copiedBackend ? <Check size={16} /> : <Copy size={16} />}
                            {copiedBackend ? 'Copied!' : 'Copy Mermaid Code'}
                        </button>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto relative group">
                        <button
                            onClick={() => setZoomedDiagram('backend')}
                            className="absolute top-4 right-4 p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            title="Zoom diagram"
                        >
                            <Maximize2 size={16} />
                        </button>
                        <div ref={backendDiagramRef} className="mermaid-container" />
                        {backendError && (
                            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                                <p className="text-red-400 font-semibold mb-2">⚠️ Diagram Rendering Error:</p>
                                <p className="text-red-300 text-sm mb-3">{backendError}</p>
                                <details className="text-xs">
                                    <summary className="cursor-pointer text-gray-400 hover:text-white">Show Raw Mermaid Code</summary>
                                    <pre className="mt-2 p-3 bg-black/50 rounded overflow-x-auto text-gray-300">
                                        {data.backend_diagram?.code}
                                    </pre>
                                </details>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Frontend UI Architecture */}
            {data.frontend_diagram?.code && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-3xl font-bold">Frontend UI Architecture</h2>
                        <button
                            onClick={copyFrontendDiagram}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors"
                        >
                            {copiedFrontend ? <Check size={16} /> : <Copy size={16} />}
                            {copiedFrontend ? 'Copied!' : 'Copy Mermaid Code'}
                        </button>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto relative group">
                        <button
                            onClick={() => setZoomedDiagram('frontend')}
                            className="absolute top-4 right-4 p-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            title="Zoom diagram"
                        >
                            <Maximize2 size={16} />
                        </button>
                        <div ref={frontendDiagramRef} className="mermaid-container" />
                        {frontendError && (
                            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                                <p className="text-red-400 font-semibold mb-2">⚠️ Diagram Rendering Error:</p>
                                <p className="text-red-300 text-sm mb-3">{frontendError}</p>
                                <details className="text-xs">
                                    <summary className="cursor-pointer text-gray-400 hover:text-white">Show Raw Mermaid Code</summary>
                                    <pre className="mt-2 p-3 bg-black/50 rounded overflow-x-auto text-gray-300">
                                        {data.frontend_diagram?.code}
                                    </pre>
                                </details>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Sequence Diagram */}
            {data.sequence_diagram?.code && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-3xl font-bold">Sequence Diagram</h2>
                        <button
                            onClick={copySequenceDiagram}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors">
                            {copiedSequence ? <Check size={16} /> : <Copy size={16} />}
                            {copiedSequence ? 'Copied!' : 'Copy Mermaid Code'}
                        </button>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto relative group">
                        <button
                            onClick={() => setZoomedDiagram('sequence')}
                            className="absolute top-4 right-4 p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            title="Zoom diagram"
                        >
                            <Maximize2 size={16} />
                        </button>
                        <div ref={sequenceDiagramRef} className="mermaid-container" />
                        {sequenceError && (
                            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                                <p className="text-red-400 font-semibold mb-2">⚠️ Diagram Rendering Error:</p>
                                <p className="text-red-300 text-sm mb-3">{sequenceError}</p>
                                <details className="text-xs">
                                    <summary className="cursor-pointer text-gray-400 hover:text-white">Show Raw Mermaid Code</summary>
                                    <pre className="mt-2 p-3 bg-black/50 rounded overflow-x-auto text-gray-300">
                                        {data.sequence_diagram.code}
                                    </pre>
                                </details>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Database Schema */}
            {renderDatabaseSchema()}


            {/* Zoom Modal - Portal to document.body for true fullscreen */}
            {zoomedDiagram && createPortal(
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
                                {zoomedDiagram === 'system' ? 'System Architecture Diagram' :
                                    zoomedDiagram === 'backend' ? 'Backend Processing Architecture' :
                                        zoomedDiagram === 'frontend' ? 'Frontend UI Architecture' :
                                            'Sequence Diagram'}
                            </h2>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl">
                                {zoomedDiagram === 'system' ? (
                                    <div ref={zoomSystemRef} className="mermaid-container" />
                                ) : zoomedDiagram === 'backend' ? (
                                    <div ref={zoomBackendRef} className="mermaid-container" />
                                ) : zoomedDiagram === 'frontend' ? (
                                    <div ref={zoomFrontendRef} className="mermaid-container" />
                                ) : (
                                    <div ref={zoomSequenceRef} className="mermaid-container" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* API Design Principles */}
            {data.api_design_principles && data.api_design_principles.length > 0 && (
                <div>
                    <h2 className="text-3xl font-bold mb-4">API Design Principles</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.api_design_principles.map((principle: any, idx: number) => (
                            <div key={idx} className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                                <h4 className="font-bold text-blue-400 mb-2">{principle.principle}</h4>
                                <p className="text-gray-300 text-sm">{principle.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArchitectureViewer;
