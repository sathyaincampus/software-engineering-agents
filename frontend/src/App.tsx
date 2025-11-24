import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Boardroom from './pages/Boardroom';
import MissionControl from './pages/MissionControl';
import ProjectHistory from './pages/ProjectHistory';

const Artifacts = () => <div>Artifacts Viewer (Coming Soon)</div>;
const Showcase = () => <div>Showcase Gallery (Coming Soon)</div>;

function App() {
  return (
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
  );
}

export default App;
