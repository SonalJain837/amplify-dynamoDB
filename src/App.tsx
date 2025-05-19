import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import TripCommentsPage from './pages/tripComments';
import ContactUs from './pages/ContactUs';
import Profile from './pages/Profile';
import TermsPage from './pages/TermsPage';
import './App.css';

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', width: '100%', backgroundColor: '#f5f8fa' }}>
        <main style={{ width: '100%', padding: 0, margin: 0 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/trip/:tripId/comments" element={<TripCommentsPage />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
