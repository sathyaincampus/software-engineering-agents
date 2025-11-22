import React, { useCallback } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
    { id: '1', position: { x: 0, y: 0 }, data: { label: 'User' }, type: 'input' },
    { id: '2', position: { x: 0, y: 100 }, data: { label: 'Frontend (React)' } },
    { id: '3', position: { x: 0, y: 200 }, data: { label: 'Backend (FastAPI)' } },
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
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                    Generate Architecture
                </button>
            </div>

            <div className="flex-1 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden" style={{ minHeight: '500px' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    fitView
                >
                    <Background color="#4B5563" gap={16} />
                    <Controls />
                    <MiniMap style={{ height: 120 }} zoomable pannable />
                </ReactFlow>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-semibold mb-4">Kanban Board</h3>
                    <div className="space-y-2">
                        <div className="p-3 bg-gray-700 rounded border border-gray-600">User Story #1</div>
                        <div className="p-3 bg-gray-700 rounded border border-gray-600">User Story #2</div>
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-semibold mb-4">Approval Gates</h3>
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded border border-gray-600">
                        <span>Architecture Review</span>
                        <button className="text-xs bg-green-600 px-2 py-1 rounded">Approve</button>
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-semibold mb-4">Model Selector</h3>
                    <select className="w-full bg-gray-700 border border-gray-600 rounded p-2">
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
