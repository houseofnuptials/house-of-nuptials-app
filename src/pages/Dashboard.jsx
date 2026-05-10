import React, { useEffect, useState, useCallback } from 'react';
import { differenceInDays, format, parseISO } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import { getTasks, toggleTask } from '../lib/supabase';

const PHASE_TIMING = ['', '12+ months', '9–12 months', '6–9 months', '3–6 months', '6–12 weeks'];

function CountdownRing({ days, totalDays }) {
  const pct = Math.max(0, Math.min(1, (totalDays - days) / totalDays));
  const r = 34;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(250,247,242,0.08)" strokeWidth="5" />
      <circle cx="40" cy="40" r={r} fill="none" stroke="#C4D4C0" strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 40 40)"
        style={{ transition: 'stroke-dashoffset 1s ease' }} />
      <text x="40" y="44" textAnchor="middle" fontFamily="Cormorant Garamond,Georgia,serif"
        fontSize="18" fontWeight="300" fill="#FAF7F2">{days > 999 ? '∞' : days}</text>
    </svg>
  );
}

function TaskPhase({ phase, tasks, onToggle }) {
  const [open, setOpen] = useState(phase.phase_number <= 2);
  const completed = tasks.filter(t => t.is_completed).length;
  const pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const isActive = pct > 0 && pct < 100;
  const isDone = pct === 100;

  return (
    <div className="card" style={{ marginBottom: '0.75rem' }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
            background: isDone ? 'var(--sage)' : isActive ? 'var(--blush)' : 'var(--sage-light)',
            border: `2px solid ${isDone ? 'var(--sage-dark)' : isActive ? 'var(--blush)' : 'var(--sage-light)'}`,
          }} />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 400 }}>{phase.phase_title}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--warm-grey)', letterSpacing: '0.1em', marginTop: '0.1rem' }}>
              {PHASE_TIMING[phase.phase_number]} · {completed}/{tasks.length} tasks
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className={`pill ${isDone ? 'pill-done' : isActive ? 'pill-now' : 'pill-upcoming'}`}>
            {isDone ? 'Complete' : isActive ? 'In progress' : 'Upcoming'}
          </span>
          <span style={{ color: 'var(--warm-grey)', fontSize: '0.75rem', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>›</span>
        </div>
      </div>

      {open && (
        <div style={{ borderTop: '1px solid rgba(46,43,62,0.06)', padding: '0.5rem 1.25rem 0.75rem' }}>
          <div className="progress-bar" style={{ marginBottom: '0.75rem' }}>
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          {tasks.map(task => (
            <div key={task.id}
              onClick={() => onToggle(task.id, !task.is_completed)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                padding: '0.6rem 0',
                borderBottom: '1px solid rgba(46,43,62,0.05)',
                cursor: 'pointer',
              }}>
              <div style={{
                width: '1.1rem', height: '1.1rem', borderRadius: '3px', flexShrink: 0,
                border: `1.5px solid ${task.is_completed ? 'var(--sage)' : 'rgba(46,43,62,0.2)'}`,
                background: task.is_completed ? 'var(--sage)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: '0.1rem',
                transition: 'all 0.15s',
              }}>
                {task.is_completed && <span style={{ color: 'white', fontSize: '0.55rem' }}>✓</span>}
              </div>
              <span style={{
                fontSize: '0.82rem', fontWeight: 300, lineHeight: 1.45,
                color: task.is_completed ? 'var(--warm-grey)' : 'var(--navy)',
                textDecoration: task.is_completed ? 'line-through' : 'none',
                opacity: task.is_completed ? 0.6 : 1,
                transition: 'all 0.15s',
              }}>{task.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ showToast }) {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const loadTasks = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getTasks(user.id);
      setTasks(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTasks(false);
    }
  }, [user]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  async function handleToggle(taskId, isCompleted) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: isCompleted } : t));
    try {
      await toggleTask(taskId, isCompleted);
      if (isCompleted) showToast('Task complete! ✓');
    } catch {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: !isCompleted } : t));
    }
  }

  const weddingDate = (profile?.wedding_date || user?.user_metadata?.wedding_date) ? parseISO(profile?.wedding_date || user?.user_metadata?.wedding_date) : null;
  const daysLeft = weddingDate ? Math.max(0, differenceInDays(weddingDate, new Date())) : null;
  const totalDays = 548;

  const phases = [...new Map(tasks.map(t => [t.phase_number, { phase_number: t.phase_number, phase_title: t.phase_title }])).values()].sort((a, b) => a.phase_number - b.phase_number);
  const totalCompleted = tasks.filter(t => t.is_completed).length;
  const overallPct = tasks.length ? Math.round((totalCompleted / tasks.length) * 100) : 0;

  const currentMonthTasks = tasks.filter(t => {
    const phase = t.phase_number;
    if (daysLeft === null) return false;
    if (daysLeft > 270) return phase === 1;
    if (daysLeft > 180) return phase === 2;
    if (daysLeft > 90) return phase === 3;
    if (daysLeft > 42) return phase === 4;
    return phase === 5;
  });
  const monthCompleted = currentMonthTasks.filter(t => t.is_completed).length;

  const firstName = profile?.first_name || user?.user_metadata?.first_name || 'Bride';
  const isPremium = profile?.is_premium || false;
  const weddingDateStr = profile?.wedding_date || user?.user_metadata?.wedding_date || null;

  function getPhaseLabel() {
    if (!daysLeft) return '';
    if (daysLeft > 270) return 'Phase 1 · The Big Decisions';
    if (daysLeft > 180) return 'Phase 2 · Key Supplier Bookings';
    if (daysLeft > 90) return 'Phase 3 · The Details';
    if (daysLeft > 42) return 'Phase 4 · Logistics & Admin';
    return 'Phase 5 · Final Confirmations';
  }

  return (
    <div className="screen-content fade-up">
      {/* Hero */}
      <div style={{ background: 'var(--navy)', padding: '1.5rem 1.25rem 2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', border: '1px solid rgba(250,247,242,0.04)', pointerEvents: 'none' }} />
        <div style={{ fontSize: '0.68rem', fontWeight: 400, letterSpacing: '0.15em', color: 'rgba(250,247,242,0.4)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
          Good day
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 300, color: 'var(--cream)', marginBottom: '1.5rem' }}>
          {firstName}, <em style={{ fontStyle: 'italic', color: 'var(--sage-light)' }}>let's plan</em> 💍
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'rgba(250,247,242,0.05)', borderRadius: 'var(--radius)', padding: '1.25rem' }}>
          <CountdownRing days={daysLeft ?? 0} totalDays={totalDays} />
          <div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(250,247,242,0.4)', marginBottom: '0.15rem' }}>Days until your wedding</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', fontWeight: 300, color: 'var(--cream)', lineHeight: 1 }}>{daysLeft ?? '–'}</div>
            {weddingDate && <div style={{ fontSize: '0.78rem', fontWeight: 300, color: 'rgba(250,247,242,0.55)', marginTop: '0.2rem' }}>{format(weddingDate, 'EEEE, d MMMM yyyy')}</div>}
            {daysLeft !== null && <div style={{ display: 'inline-block', marginTop: '0.4rem', fontSize: '0.58rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sage-light)', background: 'rgba(196,212,192,0.12)', padding: '0.2rem 0.6rem', borderRadius: '2rem' }}>{getPhaseLabel()}</div>}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ padding: '1.25rem' }}>
        <div className="section-label" style={{ marginBottom: '0.85rem' }}>Your progress</div>
        <div className="card" style={{ padding: '1.25rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 400 }}>Overall planning</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--sage-dark)' }}>{overallPct}%</span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${overallPct}%` }} /></div>
        </div>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 400 }}>Current phase tasks</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--sage-dark)' }}>{monthCompleted}/{currentMonthTasks.length}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: currentMonthTasks.length ? `${Math.round((monthCompleted / currentMonthTasks.length) * 100)}%` : '0%' }} />
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div style={{ padding: '0 1.25rem' }}>
        <div className="section-label" style={{ marginBottom: '0.85rem' }}>Your planning phases</div>
        {loadingTasks ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <div className="spinner" />
          </div>
        ) : (
          phases.map(phase => (
            <TaskPhase
              key={phase.phase_number}
              phase={phase}
              tasks={tasks.filter(t => t.phase_number === phase.phase_number)}
              onToggle={handleToggle}
            />
          ))
        )}
      </div>

      {/* Upgrade banner for free users */}
      {!isPremium && (
        <div style={{ padding: '0 1.25rem 1.25rem' }}>
          <div className="upgrade-banner">
            <h3>Unlock <em>expert notes</em> at every stage</h3>
            <p>Upgrade to Premium for detailed guidance, budget tracking, vendor email scripts, and more.</p>
            <button className="btn btn-sage btn-full" onClick={() => window.location.href = '/pricing'}>
              Upgrade — from £12.99/mo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
