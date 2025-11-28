import { useState } from 'react';
import axios from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
    FileText,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Loader2,
    Bug,
    RefreshCw,
    Code2,
    Terminal,
    ChevronRight,
    ChevronDown
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8050';

interface CodeFile {
    path: string;
    content?: string;
    size: number;
    modified?: string;
}

interface LintIssue {
    file: string;
    line: number;
    severity: 'error' | 'warning' | 'info';
    message: string;
    code?: string;
}

interface DebugResult {
    analysis: string;
    fixes: Array<{
        path: string;
        content: string;
        explanation: string;
    }>;
    severity: 'critical' | 'warning' | 'info';
}

interface CodeViewerProps {
    sessionId: string;
    files: CodeFile[];
    onRefresh: () => void;
}

const CodeViewer: React.FC<CodeViewerProps> = ({ sessionId, files, onRefresh }) => {
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [linting, setLinting] = useState(false);
    const [debugging, setDebugging] = useState(false);
    const [lintResults, setLintResults] = useState<LintIssue[]>([]);
    const [debugResult, setDebugResult] = useState<DebugResult | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    // Helper function to detect language from file extension
    const getLanguageFromPath = (path: string): string => {
        const ext = path.split('.').pop()?.toLowerCase();
        const languageMap: Record<string, string> = {
            'ts': 'typescript',
            'tsx': 'tsx',
            'js': 'javascript',
            'jsx': 'jsx',
            'py': 'python',
            'json': 'json',
            'md': 'markdown',
            'css': 'css',
            'scss': 'scss',
            'html': 'html',
            'yaml': 'yaml',
            'yml': 'yaml',
            'sh': 'bash',
            'sql': 'sql',
            'go': 'go',
            'rs': 'rust',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'xml': 'xml',
        };
        return languageMap[ext || ''] || 'text';
    };

    // Organize files into a tree structure
    const buildFileTree = (files: CodeFile[]) => {
        const tree: any = {};

        files.forEach(file => {
            const parts = file.path.replace('code/', '').split('/');
            let current = tree;

            parts.forEach((part, index) => {
                if (index === parts.length - 1) {
                    // It's a file
                    current[part] = file;
                } else {
                    // It's a folder
                    if (!current[part]) {
                        current[part] = {};
                    }
                    current = current[part];
                }
            });
        });

        return tree;
    };

    const fileTree = buildFileTree(files);

    const loadFileContent = async (filePath: string) => {
        setLoading(true);
        try {
            // Check if file is in code directory or project root
            if (filePath.startsWith('code/')) {
                // File is in code directory
                const cleanPath = filePath.replace('code/', '');
                const url = `${API_BASE_URL}/projects/${sessionId}/code/${cleanPath}`;
                const res = await axios.get(url);
                setFileContent(res.data.content);
                setSelectedFile(filePath);
            } else {
                // File is in project root (ideas.json, prd.md, etc.)
                // Use the step endpoint instead
                const fileName = filePath.split('/').pop()?.replace(/\.(json|md)$/, '') || '';
                const res = await axios.get(`${API_BASE_URL}/projects/${sessionId}/${fileName}`);

                // Format the content based on type
                if (res.data && res.data.data) {
                    const content = typeof res.data.data === 'string'
                        ? res.data.data
                        : JSON.stringify(res.data.data, null, 2);
                    setFileContent(content);
                    setSelectedFile(filePath);
                }
            }
        } catch (e) {
            console.error('Error loading file:', e);
            setFileContent('// Error loading file: ' + (e as any).message);
        } finally {
            setLoading(false);
        }
    };

    const runLinter = async () => {
        if (!selectedFile) return;

        setLinting(true);
        try {
            const codeFiles: Record<string, string> = {};
            codeFiles[selectedFile] = fileContent;

            const res = await axios.post(`${API_BASE_URL}/agent/debugger/lint?session_id=${sessionId}`, {
                code_files: codeFiles
            });

            setLintResults(res.data.issues || []);
        } catch (e) {
            console.error('Error running linter:', e);
        } finally {
            setLinting(false);
        }
    };

    const debugCode = async () => {
        if (!selectedFile || !errorMessage) return;

        setDebugging(true);
        try {
            const codeFiles: Record<string, string> = {};
            codeFiles[selectedFile] = fileContent;

            const res = await axios.post(`${API_BASE_URL}/agent/debugger/debug?session_id=${sessionId}`, {
                error_message: errorMessage,
                code_files: codeFiles,
                context: {}
            });

            setDebugResult(res.data);

            // Auto-apply fixes if available
            if (res.data.fixes && res.data.fixes.length > 0) {
                const fix = res.data.fixes.find((f: any) => f.path === selectedFile);
                if (fix) {
                    setFileContent(fix.content);
                }
            }
        } catch (e) {
            console.error('Error debugging:', e);
        } finally {
            setDebugging(false);
        }
    };

    const toggleFolder = (path: string) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        setExpandedFolders(newExpanded);
    };

    const renderFileTree = (tree: any, path: string = '') => {
        return Object.keys(tree).map(key => {
            const item = tree[key];
            const currentPath = path ? `${path}/${key}` : key;

            if (item.path) {
                // It's a file
                return (
                    <div
                        key={item.path}
                        onClick={() => loadFileContent(item.path)}
                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ${selectedFile === item.path ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500' : ''
                            }`}
                    >
                        <FileText size={14} className="text-blue-500" />
                        <span className="text-sm font-mono">{key}</span>
                        <span className="ml-auto text-xs text-gray-400">{Math.round(item.size / 1024)}KB</span>
                    </div>
                );
            } else {
                // It's a folder
                const isExpanded = expandedFolders.has(currentPath);
                return (
                    <div key={currentPath}>
                        <div
                            onClick={() => toggleFolder(currentPath)}
                            className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <Code2 size={14} className="text-purple-500" />
                            <span className="text-sm font-semibold">{key}</span>
                        </div>
                        {isExpanded && (
                            <div className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-2">
                                {renderFileTree(item, currentPath)}
                            </div>
                        )}
                    </div>
                );
            }
        });
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'error':
            case 'critical':
                return 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
            case 'warning':
                return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
            default:
                return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
        }
    };

    return (
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
            {/* File Explorer */}
            <div className="col-span-3 bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] overflow-hidden flex flex-col">
                <div className="p-4 border-b border-[hsl(var(--border))] flex items-center justify-between bg-gray-50 dark:bg-gray-900">
                    <h3 className="font-bold text-sm">Project Files</h3>
                    <button
                        onClick={onRefresh}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        title="Refresh files"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {renderFileTree(fileTree)}
                </div>
            </div>

            {/* Code Editor & Tools */}
            <div className="col-span-9 flex flex-col gap-4">
                {/* Toolbar */}
                {selectedFile && (
                    <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <FileText size={18} className="text-blue-500" />
                                <span className="font-mono text-sm font-semibold">{selectedFile.replace('code/', '')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={runLinter}
                                    disabled={linting}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {linting ? <Loader2 size={14} className="animate-spin" /> : <Bug size={14} />}
                                    Lint Code
                                </button>
                            </div>
                        </div>

                        {/* Debug Section */}
                        <div className="space-y-3">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                💡 <strong>How to use:</strong> Paste error messages from your terminal, browser console, or lint results below. The AI will analyze and suggest fixes for this specific file.
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="e.g., 'TypeError: Cannot read property...' or 'ESLint: 'useState' is not defined'"
                                    className="flex-1 px-4 py-2 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    value={errorMessage}
                                    onChange={(e) => setErrorMessage(e.target.value)}
                                    title="Paste error messages from terminal, browser console, or lint results"
                                />
                                <button
                                    onClick={debugCode}
                                    disabled={debugging || !errorMessage}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                                    title="Analyze error and suggest fixes for the current file"
                                >
                                    {debugging ? <Loader2 size={14} className="animate-spin" /> : <Terminal size={14} />}
                                    Debug & Fix
                                </button>
                            </div>

                            {/* Debug Result */}
                            {debugResult && (
                                <div className={`p-4 rounded-lg border ${getSeverityColor(debugResult.severity)}`}>
                                    <div className="flex items-start gap-3">
                                        <Bug size={18} className="mt-0.5" />
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm mb-2">Analysis</h4>
                                            <p className="text-sm mb-3">{debugResult.analysis}</p>
                                            {debugResult.fixes.map((fix, i) => (
                                                <div key={i} className="mt-2 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                                                    <p className="text-xs font-semibold mb-1">{fix.path}</p>
                                                    <p className="text-xs">{fix.explanation}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Code Display */}
                <div className="flex-1 bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] overflow-hidden flex flex-col">
                    {selectedFile ? (
                        <>
                            <div className="flex-1 overflow-y-auto p-6 bg-[#0d1117] max-h-[600px]">
                                {loading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="animate-spin text-blue-500" size={32} />
                                    </div>
                                ) : (
                                    <SyntaxHighlighter
                                        language={getLanguageFromPath(selectedFile)}
                                        style={vscDarkPlus}
                                        showLineNumbers
                                        wrapLines
                                        customStyle={{
                                            margin: 0,
                                            padding: 0,
                                            background: 'transparent',
                                            fontSize: '13px',
                                        }}
                                        lineNumberStyle={{
                                            minWidth: '3em',
                                            paddingRight: '1em',
                                            color: '#6e7681',
                                            userSelect: 'none',
                                        }}
                                    >
                                        {fileContent || '// Empty file'}
                                    </SyntaxHighlighter>
                                )}
                            </div>

                            {/* Lint Results */}
                            {lintResults.length > 0 && (
                                <div className="border-t border-gray-800 p-4 bg-[#161b22] max-h-48 overflow-y-auto">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Lint Results</h4>
                                    <div className="space-y-2">
                                        {lintResults.map((issue, i) => (
                                            <div key={i} className="flex items-start gap-3 text-xs">
                                                {issue.severity === 'error' ? (
                                                    <XCircle size={14} className="text-red-500 mt-0.5" />
                                                ) : issue.severity === 'warning' ? (
                                                    <AlertTriangle size={14} className="text-yellow-500 mt-0.5" />
                                                ) : (
                                                    <CheckCircle size={14} className="text-blue-500 mt-0.5" />
                                                )}
                                                <div className="flex-1">
                                                    <span className="text-gray-400">Line {issue.line}:</span>{' '}
                                                    <span className="text-gray-300">{issue.message}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <div className="text-center">
                                <Code2 size={48} className="mx-auto mb-4 opacity-50" />
                                <p className="text-sm">Select a file to view its contents</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CodeViewer;
