import React, { useCallback } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    type Connection,
    type Edge
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
    { id: '1', position: { x: 0, y: 0 }, data: { label: 'User' }, type: 'input', style: { background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' } },
    { id: '2', position: { x: 0, y: 100 }, data: { label: 'Frontend (React)' }, style: { background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' } },
    { id: '3', position: { x: 0, y: 200 }, data: { label: 'Backend (FastAPI)' }, style: { background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' } },
];

const initialEdges = [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-3', source: '2', target: '3' },
];

const Boardroom: React.FC = () => {
    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Architecture Canvas</h2>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20">
                    Generate Architecture
                </button>
            </div>

            <div className="flex-1 glass-card rounded-xl overflow-hidden" style={{ minHeight: '500px' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    fitView
                    className="bg-gray-50 dark:bg-gray-900"
                >
                    <Background color="#9ca3af" gap={16} />
                    <Controls className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 fill-gray-900 dark:fill-gray-100" />
                    <MiniMap style={{ height: 120 }} zoomable pannable className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" />
                </ReactFlow>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-xl">
                    <h3 className="text-lg font-semibold mb-4">Kanban Board</h3>
                    <div className="space-y-2">
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">User Story #1</div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">User Story #2</div>
                    </div>
                </div>
                <div className="glass-card p-6 rounded-xl">
                    <h3 className="text-lg font-semibold mb-4">Approval Gates</h3>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                        <span>Architecture Review</span>
                        <button className="text-xs bg-green-600 text-white px-2 py-1 rounded">Approve</button>
                    </div>
                </div>
                <div className="glass-card p-6 rounded-xl">
                    <h3 className="text-lg font-semibold mb-4">Model Selector</h3>
                    <select className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-2 outline-none focus:ring-2 focus:ring-blue-500">
                        <option>Gemini 2.0 Flash</option>
                        <option>GPT-4o</option>
                        <option>Claude 3.5 Sonnet</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default Boardroom;
