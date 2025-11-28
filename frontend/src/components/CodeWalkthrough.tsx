import { useState } from 'react';
import axios from 'axios';
import { FileText, Video, Image, Loader2, Download, Eye } from 'lucide-react';
import MarkdownViewer from './MarkdownViewer';

const API_BASE_URL = 'http://localhost:8050';

interface CodeWalkthroughProps {
    sessionId: string;
}

const CodeWalkthrough: React.FC<CodeWalkthroughProps> = ({ sessionId }) => {
    const [generating, setGenerating] = useState(false);
    const [walkthroughType, setWalkthroughType] = useState<'text' | 'image' | 'video'>('text');
    const [walkthrough, setWalkthrough] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    const generateWalkthrough = async () => {
        setGenerating(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/agent/walkthrough/generate`, {
                session_id: sessionId,
                type: walkthroughType,
            });

            if (walkthroughType === 'text') {
                setWalkthrough(response.data.walkthrough);
            } else if (walkthroughType === 'image') {
                setImageUrl(response.data.image_url);
            } else if (walkthroughType === 'video') {
                setVideoUrl(response.data.video_url);
            }
        } catch (error) {
            console.error('Error generating walkthrough:', error);
            alert('Failed to generate walkthrough. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">Code Walkthrough Generator</h2>
                <p className="text-purple-100">Generate comprehensive documentation and walkthroughs for your generated code</p>
            </div>

            {/* Type Selector */}
            <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6">
                <h3 className="font-semibold mb-4">Select Walkthrough Type</h3>
                <div className="grid grid-cols-3 gap-4">
                    <button
                        onClick={() => setWalkthroughType('text')}
                        className={`p-4 rounded-lg border-2 transition-all ${walkthroughType === 'text'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                    >
                        <FileText className="mx-auto mb-2 text-blue-500" size={32} />
                        <div className="font-semibold">Text-Based</div>
                        <div className="text-xs text-gray-500 mt-1">Markdown documentation</div>
                    </button>

                    <button
                        onClick={() => setWalkthroughType('image')}
                        className={`p-4 rounded-lg border-2 transition-all ${walkthroughType === 'image'
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                    >
                        <Image className="mx-auto mb-2 text-purple-500" size={32} />
                        <div className="font-semibold">Image-Based</div>
                        <div className="text-xs text-gray-500 mt-1">Visual diagrams</div>
                    </button>

                    <button
                        onClick={() => setWalkthroughType('video')}
                        className={`p-4 rounded-lg border-2 transition-all ${walkthroughType === 'video'
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                    >
                        <Video className="mx-auto mb-2 text-green-500" size={32} />
                        <div className="font-semibold">Video-Based</div>
                        <div className="text-xs text-gray-500 mt-1">Animated explanation</div>
                    </button>
                </div>

                <button
                    onClick={generateWalkthrough}
                    disabled={generating}
                    className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {generating ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Generating {walkthroughType} walkthrough...
                        </>
                    ) : (
                        <>
                            <Eye size={20} />
                            Generate Walkthrough
                        </>
                    )}
                </button>
            </div>

            {/* Results */}
            {walkthrough && walkthroughType === 'text' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">Generated Walkthrough</h3>
                        <button
                            onClick={() => {
                                const blob = new Blob([walkthrough], { type: 'text/markdown' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `walkthrough-${sessionId}.md`;
                                a.click();
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Download size={16} />
                            Download
                        </button>
                    </div>
                    <MarkdownViewer content={walkthrough} />
                </div>
            )}

            {imageUrl && walkthroughType === 'image' && (
                <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg">Generated Diagram</h3>
                        <a
                            href={imageUrl}
                            download
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <Download size={16} />
                            Download
                        </a>
                    </div>
                    <img src={imageUrl} alt="Code Walkthrough Diagram" className="w-full rounded-lg" />
                </div>
            )}

            {videoUrl && walkthroughType === 'video' && (
                <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg">Generated Video</h3>
                        <a
                            href={videoUrl}
                            download
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Download size={16} />
                            Download
                        </a>
                    </div>
                    <video src={videoUrl} controls className="w-full rounded-lg" />
                </div>
            )}
        </div>
    );
};

export default CodeWalkthrough;
