import { useState, useEffect } from 'react';
import mermaid from 'mermaid';
import { Server, Database, Cloud, Code, Copy, Check } from 'lucide-react';

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
    api_design_principles?: any[];
    data_model?: any;
}

interface ArchitectureViewerProps {
    data: ArchitectureData;
}

const ArchitectureViewer: React.FC<ArchitectureViewerProps> = ({ data }) => {
    const [diagramRendered, setDiagramRendered] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: true,
            theme: 'dark',
            securityLevel: 'loose',
        });

        if (data.system_diagram?.code) {
            try {
                mermaid.contentLoaded();
                setDiagramRendered(true);
            } catch (e) {
                console.error('Mermaid rendering error:', e);
            }
        }
    }, [data.system_diagram]);

    const copyMermaidCode = () => {
        if (data.system_diagram?.code) {
            navigator.clipboard.writeText(data.system_diagram.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
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
                        <div className="space-y-2">
                            {Object.entries(data.tech_stack.frontend).map(([key, value]) => (
                                <div key={key} className="flex justify-between items-center">
                                    <span className="text-gray-400 capitalize">{key.replace(/_/g, ' ')}:</span>
                                    <span className="text-white font-medium">{String(value)}</span>
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
                        <div className="space-y-2">
                            {Object.entries(data.tech_stack.backend).map(([key, value]) => (
                                <div key={key} className="flex justify-between items-center">
                                    <span className="text-gray-400 capitalize">{key.replace(/_/g, ' ')}:</span>
                                    <span className="text-white font-medium">{String(value)}</span>
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
                        <div className="space-y-2">
                            {Object.entries(data.tech_stack.database).map(([key, value]) => (
                                <div key={key} className="flex justify-between items-center">
                                    <span className="text-gray-400 capitalize">{key.replace(/_/g, ' ')}:</span>
                                    <span className="text-white font-medium">{String(value)}</span>
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
                        <div className="space-y-2">
                            {Object.entries(data.tech_stack.devops).map(([key, value]) => (
                                <div key={key} className="flex justify-between items-center">
                                    <span className="text-gray-400 capitalize">{key.replace(/_/g, ' ')}:</span>
                                    <span className="text-white font-medium">{String(value)}</span>
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

            {/* System Diagram */}
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
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
                        <div className="mermaid">
                            {data.system_diagram.code}
                        </div>
                    </div>
                </div>
            )}

            {/* Database Schema */}
            {renderDatabaseSchema()}

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
