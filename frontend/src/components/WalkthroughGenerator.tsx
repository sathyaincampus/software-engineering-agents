import { useState } from 'react';
import { FileText, Image, Video, Eye, Loader2 } from 'lucide-react';
import axios from 'axios';

interface WalkthroughGeneratorProps {
    sessionId: string;
    onClose?: () => void;
}

type WalkthroughType = 'text' | 'image' | 'video';

const WalkthroughGenerator: React.FC<WalkthroughGeneratorProps> = ({ sessionId, onClose }) => {
    const [selectedType, setSelectedType] = useState<WalkthroughType>('text');
    const [loading, setLoading] = useState(false);
    const [walkthrough, setWalkthrough] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const API_BASE_URL = 'http://localhost:8050';

    const generateWalkthrough = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(
                `${API_BASE_URL}/agent/walkthrough/generate?session_id=${sessionId}&type=${selectedType}`
            );

            setWalkthrough(response.data);
        } catch (err: any) {
            console.error('Failed to generate walkthrough:', err);
            setError(err.response?.data?.detail || 'Failed to generate walkthrough');
        } finally {
            setLoading(false);
        }
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">Code Walkthrough Generator</h2>
                <p className="text-purple-100">
                    Generate comprehensive documentation and walkthroughs for your generated code
                </p>
            </div>

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

            {/* Walkthrough Display */}
            {walkthrough && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{walkthrough.title}</h3>
                        <span className="text-sm text-gray-500">
                            {walkthrough.estimated_reading_time || 'N/A'}
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
                        {walkthrough.sections?.map((section: any, index: number) => (
                            <details
                                key={section.section_id || index}
                                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                            >
                                <summary className="cursor-pointer font-medium">
                                    {section.title}
                                    {section.duration && (
                                        <span className="ml-2 text-sm text-gray-500">
                                            ({section.duration})
                                        </span>
                                    )}
                                </summary>
                                <div className="mt-4 space-y-3">
                                    {/* Content */}
                                    {section.content && (
                                        <div className="prose dark:prose-invert max-w-none">
                                            <p className="text-sm">{section.content}</p>
                                        </div>
                                    )}

                                    {/* Diagrams */}
                                    {section.diagrams && section.diagrams.length > 0 && (
                                        <div>
                                            <h5 className="text-sm font-semibold mb-2">Diagrams</h5>
                                            {section.diagrams.map((diagram: string, idx: number) => (
                                                <pre
                                                    key={idx}
                                                    className="p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto"
                                                >
                                                    {diagram}
                                                </pre>
                                            ))}
                                        </div>
                                    )}

                                    {/* Code Snippets */}
                                    {section.code_snippets && section.code_snippets.length > 0 && (
                                        <div>
                                            <h5 className="text-sm font-semibold mb-2">Code Examples</h5>
                                            {section.code_snippets.map((snippet: any, idx: number) => (
                                                <div key={idx} className="mb-3">
                                                    <div className="text-xs text-gray-500 mb-1">
                                                        {snippet.file}
                                                    </div>
                                                    <pre className="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-x-auto">
                                                        <code>{snippet.code}</code>
                                                    </pre>
                                                    {snippet.explanation && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                                            {snippet.explanation}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </details>
                        ))}
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
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default WalkthroughGenerator;
