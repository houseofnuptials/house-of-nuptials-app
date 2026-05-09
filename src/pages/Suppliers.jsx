import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier } from '../lib/supabase';

const CATEGORIES = ['Venue','Photographer','Videographer','Caterer','Florist','Band / DJ','Hair & Makeup','Wedding Cake','Transport','Celebrant / Registrar','Stationery','Lighting','Other'];
const ICONS = { 'Venue':'🏛️','Photographer':'📸','Videographer':'🎬','Caterer':'🍽️','Florist':'💐','Band / DJ':'🎵','Hair & Makeup':'💄','Wedding Cake':'🎂','Transport':'🚗','Celebrant / Registrar':'💒','Stationery':'✉️','Lighting':'💡','Other':'📋' };
const STATUSES = ['todo','researching','booked'];
const STATUS_LABELS = { todo: 'To Do', researching: 'Researching', booked: 'Booked' };
const STATUS_PILL = { todo: 'pill-todo', researching: 'pill-researching', booked: 'pill-booked' };

function AddSupplierModal({ onClose, onSave }) {
  const [category, setCategory] = useState('Florist');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('todo');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name) return;
    setSaving(true);
    await onSave({ category, name, status, notes, icon: ICONS[category] || '📋' });
    setSaving(false);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-title">Add Supplier</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-field">
            <label className="form-label">Category</label>
            <select className="form-input form-select" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Supplier name</label>
            <input className="form-input" placeholder="e.g. Bloom & Wild Florals" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label">Status</label>
            <select className="form-input form-select" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="todo">To Do — haven't started yet</option>
              <option value="researching">Researching — getting quotes</option>
              <option value="booked">Booked — deposit paid</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Notes (optional)</label>
            <textarea className="form-input" placeholder="Contact details, price quoted, etc." value={notes} onChange={e => setNotes(e.target.value)}
              style={{ resize: 'vertical', minHeight: '80px' }} />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1 }} disabled={!name || saving} onClick={handleSave}>
            {saving ? 'Adding…' : 'Add Supplier'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditSupplierModal({ supplier, onClose, onSave, onDelete }) {
  const [status, setStatus] = useState(supplier.status);
  const [notes, setNotes] = useState(supplier.notes || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(supplier.id, { status, notes });
    setSaving(false);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '1.5rem' }}>{supplier.icon || ICONS[supplier.category] || '📋'}</span>
          <div>
            <div className="modal-title" style={{ marginBottom: 0 }}>{supplier.name}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--warm-grey)' }}>{supplier.category}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-field">
            <label className="form-label">Status</label>
            <select className="form-input form-select" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="todo">To Do</option>
              <option value="researching">Researching</option>
              <option value="booked">Booked</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Notes</label>
            <textarea className="form-input" placeholder="Contact details, quotes, etc." value={notes} onChange={e => setNotes(e.target.value)}
              style={{ resize: 'vertical', minHeight: '80px' }} />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { onDelete(supplier.id); onClose(); }}>Remove</button>
          <button className="btn btn-primary" style={{ flex: 1 }} disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Suppliers({ showToast }) {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getSuppliers(user.id);
      setSuppliers(data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? suppliers : suppliers.filter(s => s.status === filter);

  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: suppliers.filter(x => x.status === s).length }), {});

  async function handleAdd(supplier) {
    try {
      const newSup = await addSupplier(user.id, supplier);
      setSuppliers(prev => [newSup, ...prev]);
      showToast(`${supplier.name} added ✓`);
    } catch { showToast('Could not add supplier'); }
  }

  async function handleUpdate(id, updates) {
    try {
      const updated = await updateSupplier(id, updates);
      setSuppliers(prev => prev.map(s => s.id === id ? updated : s));
      showToast('Updated ✓');
    } catch { showToast('Could not save changes'); }
  }

  async function handleDelete(id) {
    try {
      await deleteSupplier(id);
      setSuppliers(prev => prev.filter(s => s.id !== id));
      showToast('Supplier removed');
    } catch { showToast('Could not remove supplier'); }
  }

  const FILTERS = [
    { value: 'all', label: `All (${suppliers.length})` },
    { value: 'booked', label: `Booked (${counts.booked || 0})` },
    { value: 'researching', label: `Researching (${counts.researching || 0})` },
    { value: 'todo', label: `To Do (${counts.todo || 0})` },
  ];

  return (
    <div className="screen-content fade-up">
      <div style={{ padding: '1.25rem 1.25rem 0' }}>
        <div className="section-label" style={{ marginBottom: '0.25rem' }}>Supplier Tracker</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 300, marginBottom: '0.2rem' }}>Your suppliers</h2>
        <p style={{ fontSize: '0.78rem', fontWeight: 300, color: 'var(--warm-grey)' }}>
          {counts.booked || 0} booked · {counts.researching || 0} researching · {counts.todo || 0} to do
        </p>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: '0.5rem', padding: '0.85rem 1.25rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            style={{
              padding: '0.4rem 0.9rem', borderRadius: '2rem', whiteSpace: 'nowrap',
              fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.06em',
              fontFamily: 'var(--font-body)', cursor: 'pointer',
              border: `1px solid ${filter === f.value ? 'var(--navy)' : 'rgba(46,43,62,0.12)'}`,
              background: filter === f.value ? 'var(--navy)' : 'var(--warm-white)',
              color: filter === f.value ? 'var(--cream)' : 'var(--warm-grey)',
              transition: 'all 0.15s',
            }}>{f.label}</button>
        ))}
      </div>

      <div style={{ padding: '0 1.25rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📋</div>
            <p style={{ fontSize: '0.88rem', color: 'var(--warm-grey)', fontWeight: 300 }}>
              {filter === 'all' ? 'No suppliers yet. Add your first one below.' : `No ${STATUS_LABELS[filter].toLowerCase()} suppliers yet.`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {filtered.map(sup => (
              <div key={sup.id} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
                onClick={() => setEditingSupplier(sup)}>
                <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.6rem', background: 'var(--blush-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                  {sup.icon || ICONS[sup.category] || '📋'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sup.name}</div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 300, color: 'var(--warm-grey)', marginTop: '0.1rem' }}>
                    {sup.category}{sup.notes ? ' · ' + sup.notes.slice(0, 30) + (sup.notes.length > 30 ? '…' : '') : ''}
                  </div>
                </div>
                <span className={`pill ${STATUS_PILL[sup.status]}`}>{STATUS_LABELS[sup.status]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '1.25rem' }}>
        <button className="btn btn-primary btn-full" onClick={() => setShowAddModal(true)}>
          + Add Supplier
        </button>
      </div>

      {showAddModal && <AddSupplierModal onClose={() => setShowAddModal(false)} onSave={handleAdd} />}
      {editingSupplier && <EditSupplierModal supplier={editingSupplier} onClose={() => setEditingSupplier(null)} onSave={handleUpdate} onDelete={handleDelete} />}
    </div>
  );
}
