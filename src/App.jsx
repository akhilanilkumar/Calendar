import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import UsernameSetup from './components/UsernameSetup';
import AvailabilitySetup from './components/AvailabilitySetup';
import Dashboard from './components/Dashboard';
import PublicBookingPage from './components/PublicBookingPage';
import Toast from './components/Toast';
import EmailInspectorModal from './components/EmailInspectorModal';

function AppContent() {
  const { currentPath } = useApp();

  const renderRoute = () => {
    const cleanPath = currentPath.toLowerCase().trim();

    if (cleanPath === '/' || cleanPath === '') {
      return <LandingPage />;
    }
    if (cleanPath === '/login') {
      return <LoginPage />;
    }
    if (cleanPath === '/signup') {
      return <SignupPage />;
    }
    if (cleanPath === '/setup/username') {
      return <UsernameSetup />;
    }
    if (cleanPath === '/setup/availability') {
      return <AvailabilitySetup />;
    }
    if (cleanPath.startsWith('/dashboard')) {
      return <Dashboard />;
    }

    // Public username booking page (e.g., /akhil or /u/akhil)
    const targetUsername = cleanPath.startsWith('/u/')
      ? cleanPath.replace('/u/', '')
      : cleanPath.replace('/', '');

    return <PublicBookingPage targetUsername={targetUsername} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        {renderRoute()}
      </main>
      <Toast />
      <EmailInspectorModal />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
