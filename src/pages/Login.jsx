import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signIn, supabase } from '../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signIn({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError('Incorrect email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setResetSent(true);
    } catch {
      setError('Could not send reset email. Please check the address and try again.');
    } finally {
      setLoading(false);
    }
  }

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
      <div style={{ width: '100%', maxWidth: '400px', animation: 'fadeUp 0.4s ease both' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 300, color: 'var(--cream)' }}>House</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontStyle: 'italic', color: 'rgba(250,247,242,0.4)', margin: '0 0.4rem' }}>of</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 300, color: 'var(--cream)' }}>Nuptials</span>
        </div>

        {!showReset ? (
          <>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 300, color: 'var(--cream)', marginBottom: '0.5rem', textAlign: 'center' }}>
              Welcome <em style={{ fontStyle: 'italic', color: 'var(--sage-light)' }}>back</em>
            </h2>
            <p style={{ fontSize: '0.85rem', fontWeight: 300, color: 'rgba(250,247,242,0.45)', textAlign: 'center', marginBottom: '2rem' }}>
              Sign in to continue your wedding planning journey.
            </p>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-field">
                <label className="form-label" style={{ color: 'rgba(250,247,242,0.5)' }}>Email address</label>
                <input className="form-input" style={{ background: 'rgba(250,247,242,0.06)', borderColor: 'rgba(250,247,242,0.12)', color: 'var(--cream)' }}
                  type="email" placeholder="hello@example.com" value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }} required />
              </div>
              <div className="form-field">
                <label className="form-label" style={{ color: 'rgba(250,247,242,0.5)' }}>Password</label>
                <input className="form-input" style={{ background: 'rgba(250,247,242,0.06)', borderColor: 'rgba(250,247,242,0.12)', color: 'var(--cream)' }}
                  type="password" placeholder="Your password" value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }} required />
              </div>
              {error && <p style={{ color: '#ff8a80', fontSize: '0.78rem' }}>{error}</p>}
              <button type="submit" className="btn btn-sage btn-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In →'}
              </button>
            </form>
            <button
              onClick={() => setShowReset(true)}
              style={{ display: 'block', width: '100%', marginTop: '0.75rem', background: 'none', border: 'none', color: 'rgba(250,247,242,0.35)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              Forgot your password?
            </button>
            <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.82rem', color: 'rgba(250,247,242,0.35)' }}>
              Don't have an account?{' '}
              <Link to="/" style={{ color: 'var(--sage-light)', textDecoration: 'none' }}>Sign up free</Link>
            </p>
          </>
        ) : (
          <>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 300, color: 'var(--cream)', marginBottom: '0.5rem', textAlign: 'center' }}>
              Reset your <em style={{ fontStyle: 'italic', color: 'var(--sage-light)' }}>password</em>
            </h2>
            {!resetSent ? (
              <>
                <p style={{ fontSize: '0.85rem', fontWeight: 300, color: 'rgba(250,247,242,0.45)', textAlign: 'center', marginBottom: '2rem' }}>
                  Enter your email and we'll send you a reset link.
                </p>
                <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-field">
                    <label className="form-label" style={{ color: 'rgba(250,247,242,0.5)' }}>Email address</label>
                    <input className="form-input" style={{ background: 'rgba(250,247,242,0.06)', borderColor: 'rgba(250,247,242,0.12)', color: 'var(--cream)' }}
                      type="email" placeholder="hello@example.com" value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)} required />
                  </div>
                  {error && <p style={{ color: '#ff8a80', fontSize: '0.78rem' }}>{error}</p>}
                  <button type="submit" className="btn btn-sage btn-full" disabled={loading}>
                    {loading ? 'Sending…' : 'Send Reset Link'}
                  </button>
                </form>
              </>
            ) : (
              <p style={{ fontSize: '0.9rem', fontWeight: 300, color: 'var(--sage-light)', textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                ✓ Reset link sent to {resetEmail}. Check your inbox.
              </p>
            )}
            <button onClick={() => setShowReset(false)}
              style={{ display: 'block', width: '100%', marginTop: '0.75rem', background: 'none', border: 'none', color: 'rgba(250,247,242,0.35)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              ← Back to sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}
