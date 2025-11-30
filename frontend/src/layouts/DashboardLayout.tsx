import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Layers,
    Video,
    FileText,
    Moon,
    Sun,
    Settings as SettingsIcon,
    LogOut,
    Cpu,
    Command,
    Folder,
    Menu,
    X
} from 'lucide-react';
import Settings from '../components/Settings';
import ProjectSidebar from '../components/ProjectSidebar';

const DashboardLayout: React.FC = () => {
    const location = useLocation();
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' ||
                (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return true;
    });
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sidebarCollapsed') === 'true';
        }
        return false;
    });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const toggleSidebar = () => {
        const newState = !sidebarCollapsed;
        setSidebarCollapsed(newState);
        if (typeof window !== 'undefined') {
            localStorage.setItem('sidebarCollapsed', String(newState));
        }
    };

    const NavItem = ({ to, icon: Icon, label }: any) => {
        const isActive = location.pathname === to;

        if (sidebarCollapsed) {
            return (
                <Link
                    to={to}
                    className={`group flex items-center justify-center mx-2 py-2.5 rounded-lg transition-all duration-200 ${isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    title={label}
                >
                    <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'}`} />
                </Link>
            );
        }

        return (
            <Link
                to={to}
                className={`group flex items-center px-3 py-2.5 mx-3 rounded-lg transition-all duration-200 ${isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
            >
                <Icon className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'}`} />
                <span className="font-medium text-sm">{label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            </Link>
        );
    };

    return (
        <div className="flex h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className={`${sidebarCollapsed ? 'w-16' : 'w-72'} bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] flex flex-col shadow-2xl z-20 transition-all duration-300`}>
                {/* Logo Area with Toggle */}
                {!sidebarCollapsed ? (
                    <div className="p-6 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                                <Cpu className="text-white w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold tracking-tight">ZeroToOne AI</h1>
                                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Engineering Agent</p>
                            </div>
                        </div>
                        <button
                            onClick={toggleSidebar}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
                            title="Collapse sidebar"
                        >
                            <X size={18} />
                        </button>
                    </div>
                ) : (
                    <div className="p-3 flex flex-col items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <Cpu className="text-white w-6 h-6" />
                        </div>
                        <button
                            onClick={toggleSidebar}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
                            title="Expand sidebar"
                        >
                            <Menu size={18} />
                        </button>
                    </div>
                )}

                {/* Navigation */}
                <nav className="mt-2 flex-1 space-y-1">
                    {!sidebarCollapsed && (
                        <div className="px-6 pb-2">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Platform</p>
                        </div>
                    )}
                    <NavItem to="/" icon={LayoutDashboard} label="Mission Control" />
                    <NavItem to="/boardroom" icon={Layers} label="Boardroom" />
                    <NavItem to="/projects" icon={Folder} label="Projects" />

                    {!sidebarCollapsed && (
                        <div className="px-6 pb-2 pt-6">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Assets</p>
                        </div>
                    )}
                    <NavItem to="/artifacts" icon={FileText} label="Artifacts" />
                    <NavItem to="/showcase" icon={Video} label="Showcase" />
                </nav>

                {/* User / Footer */}
                <div className="p-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))/30]">
                    {!sidebarCollapsed ? (
                        <div className="flex items-center justify-between p-3 bg-[hsl(var(--background))] rounded-xl border border-[hsl(var(--border))] shadow-sm">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
                                    SA
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold">Sathya</span>
                                    <span className="text-[10px] text-gray-500">Pro Plan</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500"
                            >
                                {darkMode ? <Moon size={16} /> : <Sun size={16} />}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500"
                        >
                            {darkMode ? <Moon size={16} /> : <Sun size={16} />}
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[hsl(var(--background))] relative">
                {/* Background Gradients */}
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

                {/* Header */}
                <header className="h-16 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))/80 backdrop-blur-md flex items-center justify-between px-8 z-10 sticky top-0">
                    <div className="flex items-center gap-4">
                        {/* Empty - toggle is now in sidebar */}
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-xs font-medium border border-green-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-2"></div>
                            System Operational
                        </div>
                        <button
                            onClick={() => setSettingsOpen(true)}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        >
                            <SettingsIcon size={18} />
                        </button>
                    </div>
                </header>

                {/* Content Area with Project Sidebar */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Project Sidebar */}
                    <ProjectSidebar />

                    {/* Content Scroll Area */}
                    <div className="flex-1 overflow-auto p-8 scroll-smooth">
                        <div className="max-w-7xl mx-auto">
                            <Outlet />
                        </div>
                    </div>
                </div>
            </main>

            {/* Settings Modal */}
            <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </div>
    );
};

export default DashboardLayout;
