import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, Layers, Video, FileText } from 'lucide-react';

const DashboardLayout: React.FC = () => {
    return (
        <div className="flex h-screen bg-gray-900 text-white">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 border-r border-gray-700">
                <div className="p-6">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                        ZeroToOne AI
                    </h1>
                </div>
                <nav className="mt-6">
                    <Link to="/" className="flex items-center px-6 py-3 hover:bg-gray-700 transition-colors">
                        <LayoutDashboard className="w-5 h-5 mr-3" />
                        Mission Control
                    </Link>
                    <Link to="/boardroom" className="flex items-center px-6 py-3 hover:bg-gray-700 transition-colors">
                        <Layers className="w-5 h-5 mr-3" />
                        Boardroom
                    </Link>
                    <Link to="/artifacts" className="flex items-center px-6 py-3 hover:bg-gray-700 transition-colors">
                        <FileText className="w-5 h-5 mr-3" />
                        Artifacts
                    </Link>
                    <Link to="/showcase" className="flex items-center px-6 py-3 hover:bg-gray-700 transition-colors">
                        <Video className="w-5 h-5 mr-3" />
                        Showcase
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Project: Untitled</h2>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-400">Status: Strategy Phase</span>
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                    </div>
                </header>
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
