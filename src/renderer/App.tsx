import { Route, MemoryRouter as Router, Routes } from 'react-router-dom';
import './App.scss';
import { DataViewer } from './pages/DataViewer';
import { Record } from './pages/Record';
import { SelectPort } from './pages/SelectPort';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SelectPort />} />
      </Routes>
      <Routes>
        <Route path="/dataviewer" element={<DataViewer />} />
      </Routes>
      <Routes>
        <Route path="/record" element={<Record />} />
      </Routes>
    </Router>
  );
}
