import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import DashboardLayout from './layouts/DashboardLayout';
import Boardroom from './pages/Boardroom';
import MissionControl from './pages/MissionControl';
import ProjectHistory from './pages/ProjectHistory';

const Artifacts = () => (
  <div className="flex flex-col items-center justify-center h-full space-y-4 text-center p-8">
    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    <h2 className="text-2xl font-bold">Artifacts Viewer</h2>
    <p className="text-gray-500 max-w-md">
      Browse, download, and manage all generated project artifacts including PRDs, architecture diagrams, code files, and documentation.
    </p>
    <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Coming Soon</span>
  </div>
);

const Showcase = () => (
  <div className="flex flex-col items-center justify-center h-full space-y-4 text-center p-8">
    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center">
      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
    <h2 className="text-2xl font-bold">Showcase Gallery</h2>
    <p className="text-gray-500 max-w-md">
      Explore a curated collection of projects built with SparkToShip. Get inspired, share your creations, and see what's possible.
    </p>
    <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Coming Soon</span>
  </div>
);

function App() {
  return (
    <ProjectProvider>
      <Router>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<MissionControl />} />
            <Route path="boardroom" element={<Boardroom />} />
            <Route path="projects" element={<ProjectHistory />} />
            <Route path="artifacts" element={<Artifacts />} />
            <Route path="showcase" element={<Showcase />} />
          </Route>
        </Routes>
      </Router>
    </ProjectProvider>
  );
}

export default App;
