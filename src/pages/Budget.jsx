import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getBudgetCategories, updateBudgetCategory, addBudgetCategory, deleteBudgetCategory } from '../lib/supabase';

const CATEGORY_ICONS = ['🏛️','📸','💐','🎵','👗','✉️','🚗','✈️','🔒','🎂','💍','🌿','💡','🎁','📋'];

function BudgetModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📋');
  const [budget, setBudget] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name || !budget) return;
    setSaving(true);
    await onSave({ name, icon, budget_amount: parseFloat(budget), percentage: 0 });
    setSaving(false);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-title">Add Budget Category</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-field">
            <label className="form-label">Category name</label>
            <input className="form-input" placeholder="e.g. Videographer" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label">Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {CATEGORY_ICONS.map(ic => (
                <button key={ic} onClick={() => setIcon(ic)}
                  style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', border: `2px solid ${icon === ic ? 'var(--sage)' : 'rgba(46,43,62,0.1)'}`, background: icon === ic ? 'var(--sage-light)' : 'var(--warm-white)', fontSize: '1.1rem', cursor: 'pointer' }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Budget amount (£)</label>
            <input className="form-input" type="number" placeholder="e.g. 1500" value={budget} onChange={e => setBudget(e.target.value)} />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1 }} disabled={!name || !budget || saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Add Category'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditCategoryModal({ category, onClose, onSave, onDelete }) {
  const [spent, setSpent] = useState(String(category.spent_amount || 0));
  const [budget, setBudget] = useState(String(category.budget_amount || 0));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(category.id, { spent_amount: parseFloat(spent) || 0, budget_amount: parseFloat(budget) || 0 });
    setSaving(false);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-title">{category.icon} {category.name}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-field">
            <label className="form-label">Budget amount (£)</label>
            <input className="form-input" type="number" value={budget} onChange={e => setBudget(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label">Amount spent so far (£)</label>
            <input className="form-input" type="number" value={spent} onChange={e => setSpent(e.target.value)} />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { onDelete(category.id); onClose(); }}>Delete</button>
          <button className="btn btn-primary" style={{ flex: 1 }} disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Budget({ showToast }) {
  const { user, profile } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const isPremium = profile?.is_premium || false;
  const budgetTotal = profile?.budget_total || 20000;

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getBudgetCategories(user.id);
      setCategories(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const totalSpent = categories.reduce((s, c) => s + (c.spent_amount || 0), 0);
  const totalBudgeted = categories.reduce((s, c) => s + (c.budget_amount || 0), 0);
  const remaining = budgetTotal - totalSpent;
  const overallPct = budgetTotal ? Math.round((totalSpent / budgetTotal) * 100) : 0;

  async function handleAdd(cat) {
    try {
      const newCat = await addBudgetCategory(user.id, cat);
      setCategories(prev => [...prev, newCat]);
      showToast(`${cat.name} added ✓`);
    } catch { showToast('Could not add category'); }
  }

  async function handleUpdate(id, updates) {
    try {
      const updated = await updateBudgetCategory(id, updates);
      setCategories(prev => prev.map(c => c.id === id ? updated : c));
      showToast('Updated ✓');
    } catch { showToast('Could not save changes'); }
  }

  async function handleDelete(id) {
    try {
      await deleteBudgetCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      showToast('Category removed');
    } catch { showToast('Could not delete category'); }
  }

  const fmt = (n) => `£${n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="screen-content fade-up">
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, var(--navy) 0%, #3d3850 100%)', padding: '1.5rem 1.25rem 2rem' }}>
        <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(250,247,242,0.4)', marginBottom: '0.25rem' }}>Total Wedding Budget</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 300, color: 'var(--cream)', lineHeight: 1, marginBottom: '0.25rem' }}>{fmt(budgetTotal)}</div>
        <div style={{ fontSize: '0.78rem', fontWeight: 300, color: 'rgba(250,247,242,0.5)', marginBottom: '1rem' }}>
          {fmt(totalSpent)} spent · {fmt(remaining)} remaining
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.62rem', fontWeight: 500, letterSpacing: '0.1em', padding: '0.3rem 0.75rem', borderRadius: '2rem', background: 'rgba(232,196,180,0.2)', color: 'var(--blush)' }}>
            {fmt(totalSpent)} spent
          </span>
          <span style={{ fontSize: '0.62rem', fontWeight: 500, letterSpacing: '0.1em', padding: '0.3rem 0.75rem', borderRadius: '2rem', background: 'rgba(196,212,192,0.2)', color: 'var(--sage-light)' }}>
            {fmt(remaining)} remaining
          </span>
          <span style={{ fontSize: '0.62rem', fontWeight: 500, letterSpacing: '0.1em', padding: '0.3rem 0.75rem', borderRadius: '2rem', background: 'rgba(184,150,90,0.2)', color: 'var(--gold-light)' }}>
            {overallPct}% used
          </span>
        </div>
      </div>

      <div style={{ padding: '1.25rem' }}>
        <div className="section-label" style={{ marginBottom: '0.85rem' }}>Budget by category</div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner" /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {categories.map(cat => {
              const pct = cat.budget_amount ? Math.min(100, Math.round((cat.spent_amount / cat.budget_amount) * 100)) : 0;
              const isOver = cat.spent_amount > cat.budget_amount;
              return (
                <div key={cat.id} className="card" style={{ padding: '1rem 1.25rem', cursor: 'pointer' }}
                  onClick={() => isPremium ? setEditingCategory(cat) : showToast('Upgrade to Premium to edit categories')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1rem' }}>{cat.icon}</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 400 }}>{cat.name}</span>
                      {isOver && <span style={{ fontSize: '0.55rem', fontWeight: 500, color: '#c0392b', background: 'rgba(192,57,43,0.08)', padding: '0.15rem 0.4rem', borderRadius: '2rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Over budget</span>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 500, color: isOver ? '#c0392b' : 'var(--navy)' }}>{fmt(cat.spent_amount || 0)}</div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 300, color: 'var(--warm-grey)' }}>of {fmt(cat.budget_amount || 0)}</div>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div style={{ height: '100%', borderRadius: '3px', transition: 'width 0.8s ease', width: `${pct}%`, background: isOver ? 'linear-gradient(90deg, #e74c3c, #c0392b)' : 'linear-gradient(90deg, var(--sage-light), var(--sage-dark))' }} />
                  </div>
                </div>
              );
            })}

            {/* Add category */}
            {isPremium ? (
              <button onClick={() => setShowAddModal(true)}
                style={{ padding: '1rem 1.25rem', border: '1.5px dashed rgba(46,43,62,0.15)', borderRadius: 'var(--radius)', background: 'transparent', color: 'var(--warm-grey)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                + Add custom category
              </button>
            ) : (
              <div style={{ padding: '1rem 1.25rem', borderRadius: 'var(--radius)', background: 'var(--warm-white)', border: '1px solid rgba(46,43,62,0.07)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 300, color: 'var(--warm-grey)', lineHeight: 1.5 }}>
                  <span className="pill pill-premium" style={{ marginBottom: '0.4rem', display: 'inline-block' }}>Premium</span><br />
                  Upgrade to add custom categories, edit amounts, and track spending.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showAddModal && <BudgetModal onClose={() => setShowAddModal(false)} onSave={handleAdd} />}
      {editingCategory && <EditCategoryModal category={editingCategory} onClose={() => setEditingCategory(null)} onSave={handleUpdate} onDelete={handleDelete} />}
    </div>
  );
}
