import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getInitials, timeAgo } from '../utils/helpers';

export default function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications')
      .then(res => setNotifs(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const typeIcon = { like: '❤️', comment: '💬', message: '✉️', mention: '@', follow: '👤', announcement: '📢' };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;

  return (
    <div className="page-wrapper" style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Syne', fontSize: 22 }}>Notifications</h2>
        {notifs.some(n => !n.isRead) && (
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}>✓ Mark all read</button>
        )}
      </div>

      <div className="card">
        {notifs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <div className="empty-title">All caught up!</div>
            <div className="empty-desc">No new notifications</div>
          </div>
        ) : (
          notifs.map(n => (
            <div key={n._id} className={`notif-item ${!n.isRead ? 'unread' : ''}`}>
              <div className="avatar avatar-sm" style={{ flexShrink: 0 }}>
                {n.sender?.avatar ? <img src={n.sender.avatar} alt="" /> : getInitials(n.sender?.name || '?')}
              </div>
              <div className="notif-content">
                <div className="notif-text">
                  <span style={{ fontSize: 16 }}>{typeIcon[n.type] || '🔔'}</span>{' '}
                  <strong>{n.sender?.name}</strong> {n.content}
                </div>
                <div className="notif-time">{timeAgo(n.createdAt)}</div>
              </div>
              {!n.isRead && <div className="notif-dot" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
