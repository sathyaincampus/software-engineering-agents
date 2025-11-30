// Add these sections after the System Architecture Diagram section (after line 374)
// and before the Sequence Diagram section (before line 376)

{/* Backend Processing Architecture */ }
{
    data.backend_diagram?.code && (
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
    )
}

{/* Frontend UI Architecture */ }
{
    data.frontend_diagram?.code && (
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
    )
}


// Update the zoom modal title (around line 437)
// Replace the existing title logic with:

<h2 className="text-2xl font-bold mb-6 text-white">
    {zoomedDiagram === 'system' ? 'System Architecture Diagram' :
        zoomedDiagram === 'backend' ? 'Backend Processing Architecture' :
            zoomedDiagram === 'frontend' ? 'Frontend UI Architecture' :
                'Sequence Diagram'}
</h2>


// Update the zoom modal content (around line 440)
// Replace the existing conditional rendering with:

{
    zoomedDiagram === 'system' ? (
        <div ref={zoomSystemRef} className="mermaid-container" />
    ) : zoomedDiagram === 'backend' ? (
        <div ref={zoomBackendRef} className="mermaid-container" />
    ) : zoomedDiagram === 'frontend' ? (
        <div ref={zoomFrontendRef} className="mermaid-container" />
    ) : (
    <div ref={zoomSequenceRef} className="mermaid-container" />
)
}
