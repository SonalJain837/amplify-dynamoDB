import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, GlobalStyles, Box, CircularProgress, Typography } from '@mui/material';

// Lazy load components for better performance
const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const TripCommentsPage = React.lazy(() => import('./pages/tripComments'));
const ContactUs = React.lazy(() => import('./pages/ContactUs'));
const Profile = React.lazy(() => import('./pages/Profile'));
const PreviousTripsPage = React.lazy(() => import('./pages/PreviousTripsPage'));
const AboutUs = React.lazy(() => import('./pages/AboutUs'));
const MessagesPage = React.lazy(() => import('./pages/MessagesPage'));
import theme, { customGlobalStyles, dataGridHeaderStyles } from './theme';
import { GuideProvider, GuideController } from './components/Guide';
import { UserProvider } from './contexts/UserContext';
import './App.css';

// Loading component for lazy-loaded pages
const PageLoadingFallback: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      gap: 2
    }}
  >
    <CircularProgress size={40} sx={{ color: '#f59e0b' }} />
    <Typography variant="body2" color="text.secondary">
      Loading...
    </Typography>
  </Box>
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <style dangerouslySetInnerHTML={{ __html: dataGridHeaderStyles }} />
      <GlobalStyles styles={customGlobalStyles} />
      <UserProvider>
        <GuideProvider>
          <Router>
            <div style={{ minHeight: '100vh', width: '100%', backgroundColor: '#ffffff' }}>
              <main style={{ width: '100%', padding: 0, margin: 0 }}>
                <Suspense fallback={<PageLoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/trip/:tripId/comments" element={<TripCommentsPage />} />
                    <Route path="/contact" element={<ContactUs />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/previous-trips" element={<PreviousTripsPage />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </main>
              <GuideController />
            </div>
          </Router>
        </GuideProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
