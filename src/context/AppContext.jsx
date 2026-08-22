import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getCurrentUser,
  getUsers,
  registerUser,
  updateUserProfile,
  getUserAvailability,
  saveUserAvailability,
  createBooking,
  cancelBooking,
  getEmailOutbox,
  initializeStorage,
  setCurrentUser as setStorageCurrentUser,
  isUsernameAvailable
} from '../utils/storage';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');
  const [toast, setToast] = useState(null);
  const [emailOutbox, setEmailOutbox] = useState([]);
  const [inspectingEmail, setInspectingEmail] = useState(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Initialize storage & user session on mount
  useEffect(() => {
    initializeStorage();
    const u = getCurrentUser();
    setUser(u);
    setEmailOutbox(getEmailOutbox());

    // Simple hash/pathname sync
    const handlePopState = () => {
      const path = window.location.pathname === '/' && window.location.hash
        ? window.location.hash.replace('#', '')
        : window.location.pathname;
      setCurrentPath(path || '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigation Helper
  const navigate = (path) => {
    setCurrentPath(path);
    if (path.startsWith('/')) {
      window.history.pushState({}, '', path);
    } else {
      window.location.hash = path;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toast System
  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Auth Handlers
  const handleLogin = (email, password) => {
    const users = getUsers();
    const found = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && (!u.password || u.password === password)
    );

    if (found) {
      setUser(found);
      setStorageCurrentUser(found);
      showToast(`Welcome back, ${found.name || found.username}!`);
      navigate('/dashboard');
      return { success: true };
    } else {
      showToast('Invalid email or password', 'error');
      return { success: false, error: 'Invalid email or password' };
    }
  };

  const handleSignup = (email, password, name = '') => {
    try {
      const newUser = registerUser(email, password, name);
      setUser(newUser);
      showToast(`Account created! Let's set up your booking link.`);
      navigate('/setup/username');
      return { success: true, user: newUser };
    } catch (err) {
      showToast('Signup failed. Please try again.', 'error');
      return { success: false, error: err.message };
    }
  };

  const handleLogout = () => {
    setUser(null);
    setStorageCurrentUser(null);
    showToast('Logged out successfully');
    navigate('/');
  };

  const handleUpdateProfile = (updates) => {
    if (!user) return;
    const updated = updateUserProfile(user.id, updates);
    if (updated) {
      setUser(updated);
      showToast('Profile updated successfully!');
    }
  };

  // Availability Handler
  const handleSaveAvailability = (schedule) => {
    if (!user) return;
    saveUserAvailability(user.username, schedule);
    showToast('Availability schedule saved!');
  };

  // Booking Handler
  const handleCreateBooking = (bookingData) => {
    try {
      const booking = createBooking(bookingData);
      // Refresh outbox
      setEmailOutbox(getEmailOutbox());
      showToast(`Meeting booked with ${booking.hostName}!`, 'success');
      return { success: true, booking };
    } catch (err) {
      if (err.message === 'DOUBLE_BOOKING_CONFLICT') {
        showToast('This time slot has just been reserved by someone else! Please pick another slot.', 'error');
      } else {
        showToast('Failed to create booking', 'error');
      }
      return { success: false, error: err.message };
    }
  };

  const handleCancelBooking = (bookingId) => {
    const cancelled = cancelBooking(bookingId);
    if (cancelled) {
      showToast('Reservation cancelled');
    }
  };

  // Open Email Inspector
  const openEmailInspector = (emailObj = null) => {
    const currentOutbox = getEmailOutbox();
    setEmailOutbox(currentOutbox);
    setInspectingEmail(emailObj || (currentOutbox.length > 0 ? currentOutbox[0] : null));
    setIsEmailModalOpen(true);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        currentPath,
        navigate,
        toast,
        showToast,
        login: handleLogin,
        signup: handleSignup,
        logout: handleLogout,
        updateProfile: handleUpdateProfile,
        saveAvailability: handleSaveAvailability,
        createBooking: handleCreateBooking,
        cancelBooking: handleCancelBooking,
        emailOutbox,
        openEmailInspector,
        inspectingEmail,
        setInspectingEmail,
        isEmailModalOpen,
        setIsEmailModalOpen,
        checkUsernameAvailable: isUsernameAvailable
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
