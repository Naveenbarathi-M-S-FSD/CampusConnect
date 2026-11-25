import React, { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getInitials, ROLES, CATEGORIES } from '../utils/helpers';

export default function CreatePostModal({ onClose, onCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [visibility, setVisibility] = useState('public');
  const [targetRoles, setTargetRoles] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleRole = (role) => {
    setTargetRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('category', category);
      formData.append('visibility', visibility);
      formData.append('targetRoles', JSON.stringify(targetRoles));
      files.forEach(f => formData.append('media', f));

      const res = await api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      onCreated(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const canTarget = ['hod', 'principal', 'admin', 'professor', 'assistant_professor', 'club_member'].includes(user?.role);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Create Post</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div className="avatar avatar-md">{user?.avatar ? <img src={user.avatar} alt="" /> : getInitials(user?.name)}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{user?.name}</div>
                <select
                  className="form-select"
                  value={visibility}
                  onChange={e => setVisibility(e.target.value)}
                  style={{ marginTop: 4, padding: '4px 10px', fontSize: 12, width: 'auto' }}
                >
                  <option value="public">🌐 Public</option>
                  {canTarget && <option value="role_based">🔒 Specific Roles</option>}
                  <option value="private">🔐 Private</option>
                </select>
              </div>
            </div>

            <textarea
              className="form-textarea"
              placeholder="What's on your mind? Share an update, announcement, or event..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={5}
              style={{ marginBottom: 14 }}
              autoFocus
            />

            <div className="form-group">
              <label className="form-label">Category</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CATEGORIES.map(c => (
                  <button
                    type="button" key={c.value}
                    className={`btn btn-sm ${category === c.value ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setCategory(c.value)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {visibility === 'role_based' && (
              <div className="form-group">
                <label className="form-label">Target Roles</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {ROLES.map(r => (
                    <button
                      type="button" key={r.value}
                      className={`btn btn-sm ${targetRoles.includes(r.value) ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => toggleRole(r.value)}
                      style={{ fontSize: 11 }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Attach Media</label>
              <input
                type="file" multiple accept="image/*,video/*"
                onChange={e => setFiles(Array.from(e.target.files))}
                style={{ fontSize: 13, color: 'var(--text-secondary)' }}
              />
              {files.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--accent)' }}>
                  {files.length} file(s) selected
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !content.trim()}>
              {loading ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Posting...</> : '📤 Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
