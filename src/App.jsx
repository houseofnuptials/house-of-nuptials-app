import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Budget from './pages/Budget';
import Suppliers from './pages/Suppliers';
import Profile from './pages/Profile';

// ── LOGO (inline so no import needed) ──────────────────────────────────────
function Logo() {
  return (
    <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 300, color: 'var(--navy)', letterSpacing: '0.02em' }}>
      House <em style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--warm-grey)' }}>of</em> Nuptials
    </span>
  );
}

// ── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ message, visible }) {
  return <div className={`toast ${visible ? 'show' : ''}`}>{message}</div>;
}

// ── PROTECTED ROUTE ─────────────────────────────────────────────────────────
function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>Loading your plan…</p>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// ── TOP BAR ─────────────────────────────────────────────────────────────────
function TopBar({ onProfileClick, profile }) {
  const firstName = profile?.first_name || '?';
  return (
    <div className="topbar">
      <Logo />
      <div className="topbar-right">
        <button className="topbar-btn" aria-label="Notifications">
          🔔
          <div className="notif-dot" />
        </button>
        <button className="topbar-avatar" onClick={onProfileClick} aria-label="Profile">
          {firstName[0]?.toUpperCase() || 'B'}
        </button>
      </div>
    </div>
  );
}

// ── BOTTOM NAV ──────────────────────────────────────────────────────────────
const NAV_TABS = [
  { id: 'home',      path: '/dashboard', icon: '🏠', label: 'Home' },
  { id: 'budget',    path: '/budget',    icon: '💰', label: 'Budget' },
  { id: 'suppliers', path: '/suppliers', icon: '📋', label: 'Suppliers' },
  { id: 'profile',   path: '/profile',   icon: '👤', label: 'Profile' },
];

function BottomNav({ current }) {
  const navigate = useNavigate();
  return (
    <nav className="bottom-nav">
      {NAV_TABS.map(tab => (
        <button key={tab.id} className={`nav-tab ${current === tab.id ? 'active' : ''}`}
          onClick={() => navigate(tab.path)} aria-label={tab.label}>
          <div className="nav-tab-bar" />
          <span className="nav-tab-icon">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ── APP LAYOUT (authenticated screens) ──────────────────────────────────────
function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();

  const [toast, setToast] = useState({ message: '', visible: false });
  const toastTimer = useRef(null);

  const showToast = useCallback((message) => {
    clearTimeout(toastTimer.current);
    setToast({ message, visible: true });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
  }, []);

  const currentTab = location.pathname === '/dashboard' ? 'home'
    : location.pathname === '/budget' ? 'budget'
    : location.pathname === '/suppliers' ? 'suppliers'
    : location.pathname === '/profile' ? 'profile' : 'home';

  // Check for post-upgrade redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('upgraded') === 'true') {
      showToast('🎉 Welcome to Premium!');
    }
  }, [location.search, showToast]);

  return (
    <div className="app-shell">
      <TopBar profile={profile} onProfileClick={() => navigate('/profile')} />
      <Routes>
        <Route path="/dashboard" element={<Dashboard showToast={showToast} />} />
        <Route path="/budget"    element={<Budget    showToast={showToast} />} />
        <Route path="/suppliers" element={<Suppliers showToast={showToast} />} />
        <Route path="/profile"   element={<Profile   showToast={showToast} />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <BottomNav current={currentTab} />
      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}

// ── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      <Route path="/"      element={<Onboarding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Protected><AppLayout /></Protected>} />
      <Route path="/budget"    element={<Protected><AppLayout /></Protected>} />
      <Route path="/suppliers" element={<Protected><AppLayout /></Protected>} />
      <Route path="/profile"   element={<Protected><AppLayout /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
