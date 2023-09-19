import { Route, MemoryRouter as Router, Routes } from 'react-router-dom';
import './App.scss';
import { Menu } from './pages/Menu';
import { DataViewer } from './pages/Recorder/DataViewer';
import { Record } from './pages/Recorder/Record';
import { SelectPort } from './pages/Recorder/SelectPort';
import { Viewer } from './pages/Viewer';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Menu />} />
      </Routes>
      <Routes>
        <Route path="/viewer" element={<Viewer />} />
      </Routes>
      <Routes>
        <Route path="/recorder" element={<SelectPort />} />
      </Routes>
      <Routes>
        <Route path="/recorder/dataviewer" element={<DataViewer />} />
      </Routes>
      <Routes>
        <Route path="/recorder/record" element={<Record />} />
      </Routes>
    </Router>
  );
}
