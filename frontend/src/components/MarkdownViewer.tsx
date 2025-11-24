import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface MarkdownViewerProps {
    content: string;
    title?: string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, title }) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {title && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <h3 className="font-semibold text-lg">{title}</h3>
                    <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        {copied ? (
                            <>
                                <Check size={16} />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy size={16} />
                                Copy Markdown
                            </>
                        )}
                    </button>
                </div>
            )}
            <div className="p-6 prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-white" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-6 mb-3 text-gray-800 dark:text-gray-100" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-xl font-semibold mt-4 mb-2 text-gray-700 dark:text-gray-200" {...props} />,
                        p: ({ node, ...props }) => <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-300" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-300" {...props} />,
                        li: ({ node, ...props }) => <li className="ml-4" {...props} />,
                        code: ({ node, inline, ...props }: any) =>
                            inline ? (
                                <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-pink-600 dark:text-pink-400" {...props} />
                            ) : (
                                <code className="block p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto text-sm font-mono" {...props} />
                            ),
                        blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400 my-4" {...props} />,
                        table: ({ node, ...props }) => <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 my-4" {...props} />,
                        th: ({ node, ...props }) => <th className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-left text-sm font-semibold" {...props} />,
                        td: ({ node, ...props }) => <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-sm" {...props} />,
                        a: ({ node, ...props }) => <a className="text-blue-600 dark:text-blue-400 hover:underline" {...props} />,
                        hr: ({ node, ...props }) => <hr className="my-8 border-gray-300 dark:border-gray-700" {...props} />,
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>
        </div>
    );
};

export default MarkdownViewer;
