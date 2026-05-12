import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Budget from './pages/Budget';
import Suppliers from './pages/Suppliers';
import Profile from './pages/Profile';

function Toast({ message, visible }) {
  return <div className={`toast ${visible ? 'show' : ''}`}>{message}</div>;
}

function TopBar({ onProfileClick, initial }) {
  return (
    <div className="topbar">
      <span style={{fontFamily:'var(--font-display)',fontSize:'1.3rem',fontWeight:300,color:'var(--navy)'}}>
        House <em style={{fontStyle:'italic',fontSize:'0.9rem',color:'var(--warm-grey)'}}>of</em> Nuptials
      </span>
      <div className="topbar-right">
        <button className="topbar-btn">🔔<div className="notif-dot"/></button>
        <button className="topbar-avatar" onClick={onProfileClick}>{initial||'B'}</button>
      </div>
    </div>
  );
}

const NAV_TABS = [
  {id:'home',path:'/dashboard',icon:'🏠',label:'Home'},
  {id:'budget',path:'/budget',icon:'💰',label:'Budget'},
  {id:'suppliers',path:'/suppliers',icon:'📋',label:'Suppliers'},
  {id:'profile',path:'/profile',icon:'👤',label:'Profile'},
];

function BottomNav({ current }) {
  const navigate = useNavigate();
  return (
    <nav className="bottom-nav">
      {NAV_TABS.map(tab => (
        <button key={tab.id} className={`nav-tab ${current===tab.id?'active':''}`} onClick={()=>navigate(tab.path)}>
          <div className="nav-tab-bar"/>
          <span className="nav-tab-icon">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState({message:'',visible:false});
  const timer = useRef(null);

  const showToast = useCallback((message) => {
    clearTimeout(timer.current);
    setToast({message,visible:true});
    timer.current = setTimeout(()=>setToast(t=>({...t,visible:false})),2500);
  },[]);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      if(!session){navigate('/login');return;}
      setUser(session.user);
      supabase.from('profiles').select('*').eq('id',session.user.id).maybeSingle()
        .then(({data})=>{setProfile(data);setReady(true);});
    });
  },[navigate]);

  useEffect(()=>{
    const params = new URLSearchParams(location.search);
    if(params.get('upgraded')==='true') showToast('Welcome to Premium! 🎉');
  },[location.search,showToast]);

  if(!ready) return (
    <div className="loading-screen">
      <div className="spinner"/>
      <p>Loading your plan…</p>
    </div>
  );

  const tab = location.pathname==='/dashboard'?'home':location.pathname==='/budget'?'budget':location.pathname==='/suppliers'?'suppliers':location.pathname==='/profile'?'profile':'home';
  const firstName = profile?.first_name||user?.user_metadata?.first_name||'B';
  const initial = firstName[0]?.toUpperCase()||'B';
  const props = {showToast,user,profile};

  return (
    <div className="app-shell">
      <TopBar initial={initial} onProfileClick={()=>navigate('/profile')}/>
      <Routes>
        <Route path="/dashboard" element={<Dashboard {...props}/>}/>
        <Route path="/budget" element={<Budget {...props}/>}/>
        <Route path="/suppliers" element={<Suppliers {...props}/>}/>
        <Route path="/profile" element={<Profile {...props}/>}/>
        <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
      </Routes>
      <BottomNav current={tab}/>
      <Toast message={toast.message} visible={toast.visible}/>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Onboarding/>}/>
      <Route path="/login" element={<Login/>}/>
      <Route path="/dashboard" element={<AppLayout/>}/>
      <Route path="/budget" element={<AppLayout/>}/>
      <Route path="/suppliers" element={<AppLayout/>}/>
      <Route path="/profile" element={<AppLayout/>}/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  );
}
