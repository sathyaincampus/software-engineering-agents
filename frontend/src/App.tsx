import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Boardroom from './pages/Boardroom';

const MissionControl = () => <div className="text-center mt-20"><h2 className="text-3xl">Welcome to Mission Control</h2><p className="mt-4 text-gray-400">Select a project or start a new one.</p></div>;
const Artifacts = () => <div>Artifacts Viewer (Coming Soon)</div>;
const Showcase = () => <div>Showcase Gallery (Coming Soon)</div>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<MissionControl />} />
          <Route path="boardroom" element={<Boardroom />} />
          <Route path="artifacts" element={<Artifacts />} />
          <Route path="showcase" element={<Showcase />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
