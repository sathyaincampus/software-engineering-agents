import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    type Connection,
    type Edge,
    type Node
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useProject } from '../context/ProjectContext';
import axios from 'axios';
import { Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';

import { API_BASE_URL } from '../config';

const initialNodes: Node[] = [
    { id: '1', position: { x: 250, y: 0 }, data: { label: 'User' }, type: 'input', style: { background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' } },
    { id: '2', position: { x: 100, y: 100 }, data: { label: 'Frontend (React)' }, style: { background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' } },
    { id: '3', position: { x: 400, y: 100 }, data: { label: 'Backend (FastAPI)' }, style: { background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' } },
    { id: '4', position: { x: 400, y: 200 }, data: { label: 'Database' }, style: { background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' } },
];

const initialEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e1-3', source: '1', target: '3', animated: true },
    { id: 'e2-3', source: '2', target: '3', animated: true },
    { id: 'e3-4', source: '3', target: '4' },
];

const Boardroom: React.FC = () => {
    const { sprintPlan, architecture, sessionId } = useProject();
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [taskStatuses, setTaskStatuses] = useState<Record<string, string>>({});

    const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    // Fetch task statuses periodically
    useEffect(() => {
        const fetchStatuses = async () => {
            if (!sessionId) return;
            try {
                const res = await axios.get(`${API_BASE_URL}/projects/${sessionId}/task_statuses`);
                if (res.data && res.data.task_statuses) {
                    setTaskStatuses(res.data.task_statuses);
                }
            } catch (e) {
                console.error("Failed to fetch task statuses", e);
            }
        };

        fetchStatuses();
        const interval = setInterval(fetchStatuses, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [sessionId]);

    // Update nodes if architecture is available (Simple mapping)
    useEffect(() => {
        if (architecture && architecture.system_diagram) {
            // In a real implementation, we would parse the Mermaid code to nodes/edges
            // For now, we'll just update labels if possible or keep the default structure
            // This is a placeholder for "Live Architecture Visualization"
        }
    }, [architecture]);

    const getTasksByStatus = (status: string) => {
        const tasks = Array.isArray(sprintPlan) ? sprintPlan : (sprintPlan?.sprint_plan || []);

        return tasks.filter((task: any) => {
            const taskStatus = taskStatuses[task.task_id] || 'pending';
            if (status === 'todo') return taskStatus === 'pending' || taskStatus === 'loading';
            if (status === 'done') return taskStatus === 'complete';
            if (status === 'error') return taskStatus === 'error' || taskStatus === 'skipped';
            return false;
        });
    };

    const StatusIcon = ({ status }: { status: string }) => {
        if (status === 'complete') return <CheckCircle size={16} className="text-green-500" />;
        if (status === 'loading') return <Loader2 size={16} className="text-blue-500 animate-spin" />;
        if (status === 'error') return <AlertCircle size={16} className="text-red-500" />;
        return <Clock size={16} className="text-gray-400" />;
    };

    return (
        <div className="h-full flex flex-col space-y-6 p-2">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Boardroom</h2>
                    <p className="text-gray-500">Live Architecture & Sprint Status</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full text-sm font-medium">
                        Session: {sessionId ? sessionId.slice(0, 8) : 'Inactive'}
                    </span>
                </div>
            </div>

            {/* Architecture Canvas */}
            <div className="flex-1 glass-card rounded-xl overflow-hidden shadow-sm border border-[hsl(var(--border))]" style={{ minHeight: '400px' }}>
                <div className="absolute z-10 p-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Live System Architecture</h3>
                </div>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    fitView
                    className="bg-gray-50 dark:bg-gray-900/50"
                >
                    <Background color="#9ca3af" gap={16} />
                    <Controls className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 fill-gray-900 dark:fill-gray-100" />
                    <MiniMap style={{ height: 100 }} zoomable pannable className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" />
                </ReactFlow>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-3 gap-6 h-1/3 min-h-[300px]">
                {/* Todo Column */}
                <div className="glass-card p-4 rounded-xl flex flex-col border border-[hsl(var(--border))]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-700 dark:text-gray-200">In Progress / Pending</h3>
                        <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
                            {getTasksByStatus('todo').length}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {getTasksByStatus('todo').map((task: any) => (
                            <div key={task.task_id} className="p-3 bg-[hsl(var(--background))] rounded-lg border border-[hsl(var(--border))] shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-mono text-blue-500">{task.task_id}</span>
                                    <StatusIcon status={taskStatuses[task.task_id] || 'pending'} />
                                </div>
                                <p className="text-sm font-medium line-clamp-2">{task.title}</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-[10px] uppercase bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-500">
                                        {task.assignee}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {getTasksByStatus('todo').length === 0 && (
                            <div className="text-center text-gray-400 text-sm py-8 italic">No active tasks</div>
                        )}
                    </div>
                </div>

                {/* Done Column */}
                <div className="glass-card p-4 rounded-xl flex flex-col border border-[hsl(var(--border))]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-green-700 dark:text-green-400">Completed</h3>
                        <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded-full text-xs font-bold">
                            {getTasksByStatus('done').length}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {getTasksByStatus('done').map((task: any) => (
                            <div key={task.task_id} className="p-3 bg-[hsl(var(--background))] rounded-lg border border-green-200 dark:border-green-900/30 shadow-sm opacity-75 hover:opacity-100 transition-opacity">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-mono text-green-600">{task.task_id}</span>
                                    <CheckCircle size={14} className="text-green-500" />
                                </div>
                                <p className="text-sm font-medium line-clamp-2 strike-through text-gray-500">{task.title}</p>
                            </div>
                        ))}
                        {getTasksByStatus('done').length === 0 && (
                            <div className="text-center text-gray-400 text-sm py-8 italic">No completed tasks yet</div>
                        )}
                    </div>
                </div>

                {/* Issues Column */}
                <div className="glass-card p-4 rounded-xl flex flex-col border border-[hsl(var(--border))]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-red-700 dark:text-red-400">Issues / Blocked</h3>
                        <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">
                            {getTasksByStatus('error').length}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {getTasksByStatus('error').map((task: any) => (
                            <div key={task.task_id} className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800 shadow-sm">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-mono text-red-600">{task.task_id}</span>
                                    <AlertCircle size={14} className="text-red-500" />
                                </div>
                                <p className="text-sm font-medium text-red-800 dark:text-red-300">{task.title}</p>
                                <button className="mt-2 text-xs bg-white dark:bg-gray-800 border border-red-200 text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors w-full">
                                    Retry Task
                                </button>
                            </div>
                        ))}
                        {getTasksByStatus('error').length === 0 && (
                            <div className="text-center text-gray-400 text-sm py-8 italic">No issues detected</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Boardroom;
