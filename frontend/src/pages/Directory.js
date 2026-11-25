import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getInitials, getRoleInfo, ROLES, DEPARTMENTS } from '../utils/helpers';

export default function Directory() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const navigate = useNavigate();

  const search = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQ) params.set('q', searchQ);
      if (roleFilter) params.set('role', roleFilter);
      if (deptFilter) params.set('department', deptFilter);
      const res = await api.get(`/users/search?${params}`);
      setUsers(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { search(); }, [roleFilter, deptFilter]);

  const handleSearch = (e) => { e.preventDefault(); search(); };

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Syne', fontSize: 22, marginBottom: 16 }}>Campus Directory</h2>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <div className="input-wrapper" style={{ flex: 1, minWidth: 200 }}>
            <span className="input-icon">🔍</span>
            <input placeholder="Search by name or email..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          </div>
          <select className="form-select" style={{ width: 'auto' }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto' }} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        {/* Role quick filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className={`btn btn-sm ${!roleFilter ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRoleFilter('')}>All</button>
          {ROLES.map(r => (
            <button
              key={r.value}
              className={`btn btn-sm ${roleFilter === r.value ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setRoleFilter(roleFilter === r.value ? '' : r.value)}
              style={{ borderColor: r.color + '44' }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <div className="empty-title">No users found</div>
          <div className="empty-desc">Try adjusting your search filters</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>{users.length} people found</div>
          <div className="directory-grid">
            {users.map(u => {
              const roleInfo = getRoleInfo(u.role);
              return (
                <div key={u._id} className="user-card" onClick={() => navigate(`/profile/${u._id}`)}>
                  <div className="avatar avatar-lg" style={{ background: `linear-gradient(135deg, ${roleInfo.color}88, ${roleInfo.color}44)`, color: roleInfo.color }}>
                    {u.avatar ? <img src={u.avatar} alt={u.name} /> : getInitials(u.name)}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{u.name}</div>
                  <span className="role-badge" style={{ color: roleInfo.color, borderColor: roleInfo.color + '44' }}>
                    {roleInfo.label}
                  </span>
                  {u.department && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.department}</div>}
                  {u.year && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.year}</div>}
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={e => { e.stopPropagation(); navigate(`/messages/${u._id}`); }}
                    >
                      💬 Message
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={e => { e.stopPropagation(); navigate(`/profile/${u._id}`); }}
                    >
                      👤 Profile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
