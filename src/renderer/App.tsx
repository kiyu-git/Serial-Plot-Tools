import { Route, MemoryRouter as Router, Routes } from 'react-router-dom';
import './App.scss';
import { AdjustGain } from './pages/AdjustGain';
import { Record } from './pages/Record';
import { SelectPort } from './pages/SelectPort';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SelectPort />} />
      </Routes>
      <Routes>
        <Route path="/adjustGain" element={<AdjustGain />} />
      </Routes>
      <Routes>
        <Route path="/record" element={<Record />} />
      </Routes>
    </Router>
  );
}
