import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, createDefaultTasks, createDefaultBudgetCategories } from '../lib/supabase';

const LOGO_DARK = 'data:image/svg+xml,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80">
  <text x="10" y="55" font-family="Georgia,serif" font-size="48" font-weight="300" fill="#FAF7F2">House</text>
  <text x="120" y="42" font-family="Georgia,serif" font-size="20" font-style="italic" fill="rgba(250,247,242,0.5)">of</text>
  <text x="10" y="78" font-family="Georgia,serif" font-size="48" font-weight="300" fill="#FAF7F2">Nuptials</text>
</svg>`);

const PLANNING_STYLES = [
  { value: 'self', icon: '💪', label: 'Doing it myself' },
  { value: 'guided', icon: '🗺️', label: 'Some guidance' },
  { value: 'supported', icon: '🤝', label: 'Lots of support' },
  { value: 'overwhelmed', icon: '😰', label: 'Overwhelmed!' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    email: '',
    password: '',
    weddingDate: '',
    planningStyle: '',
    budgetTotal: 20000,
  });

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  }

  async function handleFinish() {
    if (!form.planningStyle) { setError('Please choose a planning style'); return; }
    setLoading(true);
    setError('');
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            first_name: form.firstName,
            wedding_date: form.weddingDate,
            planning_style: form.planningStyle,
            budget_total: form.budgetTotal,
            is_premium: false,
          }
        }
      });
      if (signUpError) throw signUpError;

      const userId = data.user.id;
      try { await createDefaultTasks(userId); } catch(e) { console.log('tasks skipped', e); }
      try { await createDefaultBudgetCategories(userId, form.budgetTotal); } catch(e) { console.log('budget skipped', e); }

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Default wedding date = 1 year from today
  const defaultDate = new Date();
  defaultDate.setFullYear(defaultDate.getFullYear() + 1);
  const minDate = new Date().toISOString().split('T')[0];
  const defaultDateStr = defaultDate.toISOString().split('T')[0];

  const dots = [0, 1, 2, 3];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--navy)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
    }}>
      {/* Dots */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '2.5rem' }}>
        {dots.map(i => (
          <div key={i} style={{
            height: '6px',
            width: i === step ? '20px' : '6px',
            borderRadius: '3px',
            background: i === step ? 'var(--sage-light)' : 'rgba(250,247,242,0.2)',
            transition: 'all 0.3s',
          }} />
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: '400px', animation: 'fadeUp 0.4s ease both' }}>

        {/* STEP 0: Welcome */}
        {step === 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '2rem' }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.8rem',
                fontWeight: 300,
                color: 'var(--cream)',
                lineHeight: 1.1,
                display: 'block',
              }}>House</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontStyle: 'italic', color: 'rgba(250,247,242,0.4)', display: 'block' }}>of</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', fontWeight: 300, color: 'var(--cream)', lineHeight: 1.1, display: 'block' }}>Nuptials</span>
            </div>
            <p style={{ fontSize: '0.62rem', fontWeight: 500, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--sage-light)', marginBottom: '1rem' }}>Welcome</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 300, color: 'var(--cream)', lineHeight: 1.15, marginBottom: '0.75rem' }}>
              Plan your wedding<br /><em style={{ fontStyle: 'italic', color: 'var(--sage-light)' }}>week by week.</em>
            </h2>
            <p style={{ fontSize: '0.9rem', fontWeight: 300, lineHeight: 1.7, color: 'rgba(250,247,242,0.55)', marginBottom: '2rem' }}>
              We'll build you a personalised planning journey from engagement to your wedding day. Takes 60 seconds to set up.
            </p>
            <button className="btn btn-sage btn-full" onClick={() => setStep(1)}>Let's Begin →</button>
            <button
              style={{ display: 'block', width: '100%', marginTop: '0.75rem', padding: '0.85rem', background: 'transparent', border: '1px solid rgba(250,247,242,0.15)', borderRadius: 'var(--radius-sm)', color: 'rgba(250,247,242,0.5)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
              onClick={() => navigate('/login')}
            >I already have an account</button>
          </div>
        )}

        {/* STEP 1: Name & Account */}
        {step === 1 && (
          <div>
            <p style={{ fontSize: '0.62rem', fontWeight: 500, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--sage-light)', marginBottom: '1rem' }}>Step 1 of 3</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 300, color: 'var(--cream)', marginBottom: '0.6rem' }}>
              Let's get you <em style={{ fontStyle: 'italic', color: 'var(--sage-light)' }}>set up.</em>
            </h2>
            <p style={{ fontSize: '0.88rem', fontWeight: 300, color: 'rgba(250,247,242,0.5)', marginBottom: '2rem', lineHeight: 1.6 }}>Create your account to save your planning progress.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-field">
                <label className="form-label" style={{ color: 'rgba(250,247,242,0.5)' }}>Your first name</label>
                <input className="form-input" style={{ background: 'rgba(250,247,242,0.06)', borderColor: 'rgba(250,247,242,0.12)', color: 'var(--cream)' }}
                  type="text" placeholder="Olivia" value={form.firstName}
                  onChange={e => update('firstName', e.target.value)} />
              </div>
              <div className="form-field">
                <label className="form-label" style={{ color: 'rgba(250,247,242,0.5)' }}>Email address</label>
                <input className="form-input" style={{ background: 'rgba(250,247,242,0.06)', borderColor: 'rgba(250,247,242,0.12)', color: 'var(--cream)' }}
                  type="email" placeholder="hello@example.com" value={form.email}
                  onChange={e => update('email', e.target.value)} />
              </div>
              <div className="form-field">
                <label className="form-label" style={{ color: 'rgba(250,247,242,0.5)' }}>Choose a password</label>
                <input className="form-input" style={{ background: 'rgba(250,247,242,0.06)', borderColor: 'rgba(250,247,242,0.12)', color: 'var(--cream)' }}
                  type="password" placeholder="At least 8 characters" value={form.password}
                  onChange={e => update('password', e.target.value)} />
              </div>
            </div>
            {error && <p style={{ color: '#ff8a80', fontSize: '0.78rem', marginTop: '0.75rem' }}>{error}</p>}
            <button className="btn btn-sage btn-full" style={{ marginTop: '1.5rem' }}
              disabled={!form.firstName || !form.email || !form.password}
              onClick={() => {
                if (!form.firstName) { setError('Please enter your name'); return; }
                if (!form.email) { setError('Please enter your email'); return; }
                if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
                setStep(2);
              }}>Continue →</button>
          </div>
        )}

        {/* STEP 2: Wedding Date */}
        {step === 2 && (
          <div>
            <p style={{ fontSize: '0.62rem', fontWeight: 500, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--sage-light)', marginBottom: '1rem' }}>Step 2 of 3</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 300, color: 'var(--cream)', marginBottom: '0.6rem' }}>
              When's your <em style={{ fontStyle: 'italic', color: 'var(--sage-light)' }}>big day?</em>
            </h2>
            <p style={{ fontSize: '0.88rem', fontWeight: 300, color: 'rgba(250,247,242,0.5)', marginBottom: '2rem', lineHeight: 1.6 }}>Your countdown and planning timeline are built around your exact date.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-field">
                <label className="form-label" style={{ color: 'rgba(250,247,242,0.5)' }}>Wedding date</label>
                <input className="form-input" style={{ background: 'rgba(250,247,242,0.06)', borderColor: 'rgba(250,247,242,0.12)', color: 'var(--cream)', colorScheme: 'dark' }}
                  type="date" min={minDate} defaultValue={defaultDateStr}
                  onChange={e => update('weddingDate', e.target.value)} />
              </div>
              <div className="form-field">
                <label className="form-label" style={{ color: 'rgba(250,247,242,0.5)' }}>Approximate total budget</label>
                <select className="form-input form-select" style={{ background: 'rgba(250,247,242,0.06)', borderColor: 'rgba(250,247,242,0.12)', color: 'var(--cream)', colorScheme: 'dark' }}
                  onChange={e => update('budgetTotal', parseInt(e.target.value))}>
                  <option value="5000">Under £5,000</option>
                  <option value="10000">£5,000 – £10,000</option>
                  <option value="15000">£10,000 – £20,000</option>
                  <option value="20000" selected>£20,000 – £35,000</option>
                  <option value="40000">£35,000 – £50,000</option>
                  <option value="60000">£50,000+</option>
                </select>
              </div>
            </div>
            <button className="btn btn-sage btn-full" style={{ marginTop: '1.5rem' }}
              disabled={!form.weddingDate}
              onClick={() => { if (!form.weddingDate) { setError('Please enter your wedding date'); return; } setStep(3); }}>Continue →</button>
          </div>
        )}

        {/* STEP 3: Planning Style */}
        {step === 3 && (
          <div>
            <p style={{ fontSize: '0.62rem', fontWeight: 500, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--sage-light)', marginBottom: '1rem' }}>Step 3 of 3</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 300, color: 'var(--cream)', marginBottom: '0.6rem' }}>
              How much <em style={{ fontStyle: 'italic', color: 'var(--sage-light)' }}>support</em><br />do you want?
            </h2>
            <p style={{ fontSize: '0.88rem', fontWeight: 300, color: 'rgba(250,247,242,0.5)', marginBottom: '1.5rem', lineHeight: 1.6 }}>We'll tailor your experience around your planning style.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {PLANNING_STYLES.map(s => (
                <button key={s.value}
                  onClick={() => update('planningStyle', s.value)}
                  style={{
                    padding: '1rem 0.75rem',
                    border: `1px solid ${form.planningStyle === s.value ? 'var(--sage-light)' : 'rgba(250,247,242,0.12)'}`,
                    borderRadius: 'var(--radius-sm)',
                    background: form.planningStyle === s.value ? 'rgba(196,212,192,0.12)' : 'rgba(250,247,242,0.04)',
                    color: form.planningStyle === s.value ? 'var(--cream)' : 'rgba(250,247,242,0.65)',
                    fontSize: '0.82rem',
                    fontFamily: 'var(--font-body)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                  }}>
                  <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
            {error && <p style={{ color: '#ff8a80', fontSize: '0.78rem', marginBottom: '0.75rem' }}>{error}</p>}
            <button className="btn btn-sage btn-full"
              disabled={!form.planningStyle || loading}
              onClick={handleFinish}>
              {loading ? 'Building your plan…' : 'Build My Plan →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
