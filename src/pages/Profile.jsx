import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import { signOut, updateProfile } from '../lib/supabase';
import { createCheckoutSession, PLANS } from '../lib/stripe';

const SHOPIFY = 'https://www.houseofnuptials.co.uk';

function EditProfileModal({ profile, onClose, onSave }) {
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [weddingDate, setWeddingDate] = useState(profile?.wedding_date || '');
  const [budgetTotal, setBudgetTotal] = useState(String(profile?.budget_total || 20000));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave({ first_name: firstName, wedding_date: weddingDate, budget_total: parseFloat(budgetTotal) });
    setSaving(false);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-title">Edit your details</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-field">
            <label className="form-label">First name</label>
            <input className="form-input" value={firstName} onChange={e => setFirstName(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label">Wedding date</label>
            <input className="form-input" type="date" value={weddingDate} onChange={e => setWeddingDate(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label">Total budget (£)</label>
            <input className="form-input" type="number" value={budgetTotal} onChange={e => setBudgetTotal(e.target.value)} />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1 }} disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Profile({ showToast }) {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState(null);

  const isPremium = profile?.is_premium || false;
  const firstName = profile?.first_name || user?.user_metadata?.first_name || 'Bride';
  const initial = firstName[0]?.toUpperCase() || 'B';
  const weddingDate = profile?.wedding_date ? parseISO(profile.wedding_date) : null;

  async function handleSignOut() {
    try {
      await signOut();
      navigate('/login');
    } catch { showToast('Could not sign out. Please try again.'); }
  }

  async function handleSaveProfile(updates) {
    try {
      await updateProfile(user.id, updates);
      await refreshProfile();
      showToast('Profile updated ✓');
    } catch { showToast('Could not save changes'); }
  }

  async function handleUpgrade(planId) {
    setUpgradingPlan(planId);
    try {
      await createCheckoutSession(PLANS[planId].priceId, user.id, user.email);
    } catch (err) {
      showToast('Could not start checkout. Please try again.');
    } finally {
      setUpgradingPlan(null);
    }
  }

  function ProfileRow({ icon, label, value, onClick }) {
    return (
      <div onClick={onClick}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(46,43,62,0.05)', cursor: onClick ? 'pointer' : 'default' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
          <span style={{ fontSize: '1rem' }}>{icon}</span>
          {label}
        </div>
        {value && <span style={{ fontSize: '0.78rem', color: 'var(--warm-grey)' }}>{value}</span>}
        {onClick && <span style={{ fontSize: '0.75rem', color: 'var(--warm-grey)' }}>›</span>}
      </div>
    );
  }

  return (
    <div className="screen-content fade-up">
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, var(--blush-light) 0%, var(--cream) 100%)', padding: '2rem 1.25rem', textAlign: 'center' }}>
        <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 300, color: 'var(--cream)' }}>
          {initial}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 300, marginBottom: '0.25rem' }}>{firstName}</div>
        <div style={{ fontSize: '0.78rem', fontWeight: 300, color: 'var(--warm-grey)' }}>
          {weddingDate ? `Wedding: ${format(weddingDate, 'd MMMM yyyy')}` : 'Wedding date not set'}
          {isPremium && <span className="pill pill-premium" style={{ marginLeft: '0.5rem' }}>Premium</span>}
        </div>
      </div>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {/* Upgrade card for free users */}
        {!isPremium && (
          <div style={{ background: 'var(--navy)', borderRadius: 'var(--radius)', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 300, color: 'var(--cream)', marginBottom: '0.4rem' }}>
              You're on the <em style={{ fontStyle: 'italic', color: 'var(--sage-light)' }}>Free plan</em>
            </div>
            <p style={{ fontSize: '0.78rem', fontWeight: 300, color: 'rgba(250,247,242,0.55)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              Upgrade for full checklists, budget tracking, vendor email scripts, and more.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <button className="btn btn-sage btn-full" disabled={upgradingPlan === 'monthly'} onClick={() => handleUpgrade('monthly')}>
                {upgradingPlan === 'monthly' ? 'Redirecting…' : 'Monthly — £12.99/month'}
              </button>
              <button onClick={() => handleUpgrade('annual')}
                disabled={upgradingPlan === 'annual'}
                style={{ padding: '0.75rem', background: 'rgba(250,247,242,0.06)', border: '1px solid rgba(250,247,242,0.12)', borderRadius: 'var(--radius-sm)', color: 'rgba(250,247,242,0.7)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                {upgradingPlan === 'annual' ? 'Redirecting…' : 'Annual — £79.99/year (save £36)'}
              </button>
              <button onClick={() => handleUpgrade('lifetime')}
                disabled={upgradingPlan === 'lifetime'}
                style={{ padding: '0.75rem', background: 'transparent', border: 'none', color: 'rgba(250,247,242,0.35)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                {upgradingPlan === 'lifetime' ? 'Redirecting…' : 'Lifetime access — £149 once'}
              </button>
            </div>
          </div>
        )}

        {/* Wedding Details */}
        <div className="card">
          <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(46,43,62,0.06)', fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--warm-grey)' }}>Wedding Details</div>
          <ProfileRow icon="💍" label="Wedding Date" value={weddingDate ? format(weddingDate, 'd MMM yyyy') : 'Not set'} />
          <ProfileRow icon="💰" label="Total Budget" value={profile?.budget_total ? `£${Number(profile.budget_total).toLocaleString('en-GB')}` : 'Not set'} />
          <ProfileRow icon="✏️" label="Edit details" onClick={() => setShowEditModal(true)} />
        </div>

        {/* Expert Services */}
        <div className="card">
          <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(46,43,62,0.06)', fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--warm-grey)' }}>Expert Services</div>
          <ProfileRow icon="💬" label="Ask a Planner — from £49" onClick={() => window.open(`${SHOPIFY}/products/ask-a-planner-30`, '_blank')} />
          <ProfileRow icon="💰" label="Budget Audit — £39" onClick={() => window.open(`${SHOPIFY}/products/budget-audit`, '_blank')} />
          <ProfileRow icon="📋" label="On the Day Coordination" onClick={() => window.open(`${SHOPIFY}/products/on-the-day-coordination`, '_blank')} />
          <ProfileRow icon="📥" label="Digital Downloads" onClick={() => window.open(`${SHOPIFY}/collections/digital-products`, '_blank')} />
        </div>

        {/* Resources */}
        <div className="card">
          <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(46,43,62,0.06)', fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--warm-grey)' }}>Resources</div>
          <ProfileRow icon="📖" label="Planning Blog" onClick={() => window.open(`${SHOPIFY}/blogs/wedding-planning`, '_blank')} />
          <ProfileRow icon="❓" label="FAQ & Support" onClick={() => window.open(`${SHOPIFY}/pages/faq`, '_blank')} />
          <ProfileRow icon="💌" label="Contact Us" onClick={() => window.open(`${SHOPIFY}/pages/contact`, '_blank')} />
        </div>

        {/* Account */}
        <div className="card">
          <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(46,43,62,0.06)', fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--warm-grey)' }}>Account</div>
          <ProfileRow icon="🔒" label="Privacy Policy" onClick={() => window.open(`${SHOPIFY}/pages/privacy-policy`, '_blank')} />
          <div onClick={handleSignOut}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1.25rem', cursor: 'pointer', fontSize: '0.85rem', color: '#c0392b' }}>
            <span>👋</span> Sign Out
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--warm-grey)', fontWeight: 300 }}>
          House of Nuptials · houseofnuptials.co.uk
        </p>
      </div>

      {showEditModal && (
        <EditProfileModal profile={profile} onClose={() => setShowEditModal(false)} onSave={handleSaveProfile} />
      )}
    </div>
  );
}
