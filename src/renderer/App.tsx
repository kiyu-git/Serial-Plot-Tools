import { Route, HashRouter as Router, Routes } from 'react-router-dom';
import './App.scss';
import { DataViewer } from './pages/DataViewer';
import { Menu } from './pages/Menu';
import { SelectPort } from './pages/Recorder/SelectPort';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/DataViewer" element={<DataViewer />} />
        <Route path="/recorder" element={<SelectPort />} />
        {/* <Route path="/recorder/dataviewer" element={<DataViewerOld />} />
        <Route path="/recorder/record" element={<Record />} /> */}
      </Routes>
    </Router>
  );
}
