import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Edit2, Check, X } from 'lucide-react';

export default function HouseholdConfig({ users, fetchUsers, API_BASE, setActiveUser, activeUser, token }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', type: 'adult', age: '' });

  const resetForm = () => {
    setFormData({ name: '', type: 'adult', age: '' });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    
    const payload = {
      name: formData.name,
      type: formData.type,
      age: formData.type === 'child' ? parseInt(formData.age, 10) || 0 : null
    };

    try {
      if (editingId) {
        await fetch(`${API_BASE}/users/${editingId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch(`${API_BASE}/users`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }
      fetchUsers();
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;
    try {
      await fetch(`${API_BASE}/users/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (activeUser?.id === id) setActiveUser(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (user) => {
    setFormData({ name: user.name, type: user.type, age: user.age || '' });
    setEditingId(user.id);
    setIsAdding(false);
  };

  return (
    <div className="household-config glass" style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Household Profiles</h2>
        {!isAdding && !editingId && (
          <button className="tab-btn active" onClick={() => setIsAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
            <UserPlus size={16} /> Add Member
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <div className="edit-form" style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3>{editingId ? 'Edit Profile' : 'New Profile'}</h3>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Name</label>
            <input 
              className="search-input"
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              placeholder="e.g., Jackson" 
              style={{ width: '100%', marginBottom: 0 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Type</label>
            <select 
              className="search-input" 
              value={formData.type} 
              onChange={e => setFormData({...formData, type: e.target.value})}
              style={{ width: '100%', appearance: 'auto', marginBottom: 0 }}
            >
              <option value="adult">Adult (Unrestricted)</option>
              <option value="child">Child (Age Restricted)</option>
            </select>
          </div>

          {formData.type === 'child' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Age</label>
              <input 
                className="search-input"
                type="number" 
                value={formData.age} 
                onChange={e => setFormData({...formData, age: e.target.value})} 
                placeholder="e.g., 10" 
                style={{ width: '100%', marginBottom: 0 }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button className="tab-btn active" onClick={handleSave} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              <Check size={16} /> Save
            </button>
            <button className="tab-btn" onClick={resetForm} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              <X size={16} /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="users-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {users.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No profiles configured yet.</p>}
        {users.map(user => (
          <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
            <div>
              <h3 style={{ margin: '0 0 0.25rem 0' }}>{user.name}</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {user.type === 'adult' ? 'Adult' : `Child (Age ${user.age})`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => startEdit(user)}
                aria-label={`Edit ${user.name}`}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => handleDelete(user.id)}
                aria-label={`Delete ${user.name}`}
                style={{ background: 'transparent', border: 'none', color: '#ff4d4f', cursor: 'pointer', padding: '0.5rem' }}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
