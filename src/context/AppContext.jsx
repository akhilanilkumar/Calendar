import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  apiLogin,
  apiSignup,
  apiGetMe,
  apiLogout,
  apiUpdateProfile,
  apiCheckUsername,
  apiSaveAvailability,
  apiCreateBooking,
  apiCancelBooking,
  apiGetEmails
} from '../utils/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');
  const [toast, setToast] = useState(null);
  const [emailOutbox, setEmailOutbox] = useState([]);
  const [inspectingEmail, setInspectingEmail] = useState(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Restore session from JWT on mount
  useEffect(() => {
    (async () => {
      try {
        const me = await apiGetMe();
        setUser(me);
        if (me) {
          const emails = await apiGetEmails();
          setEmailOutbox(emails);
        }
      } catch {
        // no session
      } finally {
        setAuthLoading(false);
      }
    })();

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
  const handleLogin = async (email, password) => {
    try {
      const data = await apiLogin(email, password);
      setUser(data.user);
      showToast(`Welcome back, ${data.user.name || data.user.username}!`);
      navigate('/dashboard');
      return { success: true };
    } catch (err) {
      showToast(err.message || 'Invalid email or password', 'error');
      return { success: false, error: err.message };
    }
  };

  const handleSignup = async (email, password, name = '') => {
    try {
      const data = await apiSignup(email, password, name);
      setUser(data.user);
      showToast(`Account created! Let's set up your booking link.`);
      navigate('/setup/username');
      return { success: true, user: data.user };
    } catch (err) {
      showToast(err.message || 'Signup failed. Please try again.', 'error');
      return { success: false, error: err.message };
    }
  };

  const handleLogout = () => {
    apiLogout();
    setUser(null);
    showToast('Logged out successfully');
    navigate('/');
  };

  const handleUpdateProfile = async (updates) => {
    if (!user) return;
    try {
      const updated = await apiUpdateProfile(updates);
      setUser(updated);
      showToast('Profile updated successfully!');
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    }
  };

  // Availability Handler
  const handleSaveAvailability = async (schedule) => {
    if (!user) return;
    try {
      await apiSaveAvailability(schedule.timezone, schedule.days);
      showToast('Availability schedule saved!');
    } catch (err) {
      showToast(err.message || 'Failed to save availability', 'error');
    }
  };

  // Booking Handler
  const handleCreateBooking = async (bookingData) => {
    try {
      const booking = await apiCreateBooking({
        hostUsername: bookingData.hostUsername,
        guestName: bookingData.guestName,
        guestEmail: bookingData.guestEmail,
        date: bookingData.date,
        startTime: bookingData.slot.startTime,
        endTime: bookingData.slot.endTime,
        timezone: bookingData.timezone,
        message: bookingData.message
      });
      // Refresh outbox
      const emails = await apiGetEmails();
      setEmailOutbox(emails);
      showToast(`Meeting booked with ${booking.hostName}!`, 'success');
      return { success: true, booking };
    } catch (err) {
      if (err.message === 'DOUBLE_BOOKING_CONFLICT') {
        showToast('This time slot has just been reserved by someone else! Please pick another slot.', 'error');
      } else {
        showToast(err.message || 'Failed to create booking', 'error');
      }
      return { success: false, error: err.message };
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await apiCancelBooking(bookingId);
      showToast('Reservation cancelled');
    } catch (err) {
      showToast(err.message || 'Failed to cancel', 'error');
    }
  };

  // Open Email Inspector
  const openEmailInspector = async (emailObj = null) => {
    try {
      const emails = await apiGetEmails();
      setEmailOutbox(emails);
      setInspectingEmail(emailObj || (emails.length > 0 ? emails[0] : null));
      setIsEmailModalOpen(true);
    } catch {
      setIsEmailModalOpen(true);
    }
  };

  // Username availability check (async)
  const checkUsernameAvailable = async (username) => {
    try {
      return await apiCheckUsername(username);
    } catch {
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        authLoading,
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
        checkUsernameAvailable
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
