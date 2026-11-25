import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { getInitials, getRoleInfo, timeAgo } from '../utils/helpers';
import CreatePostModal from '../components/CreatePostModal';

export default function Announcements() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    api.get('/posts/feed?limit=50')
      .then(res => setPosts(res.data.posts.filter(p => ['announcement', 'event', 'notice'].includes(p.category))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const tabs = [
    { key: 'all', label: '📋 All', filter: p => true },
    { key: 'announcement', label: '📢 Announcements', filter: p => p.category === 'announcement' },
    { key: 'event', label: '🎉 Events', filter: p => p.category === 'event' },
    { key: 'notice', label: '📌 Notices', filter: p => p.category === 'notice' },
  ];

  const filtered = posts.filter(tabs.find(t => t.key === activeTab)?.filter || (() => true));

  return (
    <div className="page-wrapper" style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Syne', fontSize: 22 }}>Announcements Board</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>📤 Post Announcement</button>
      </div>

      <div className="tabs" style={{ marginBottom: 20 }}>
        {tabs.map(t => (
          <button key={t.key} className={`tab-btn ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">No announcements yet</div>
          <div className="empty-desc">Be the first to post an announcement</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(post => {
            const roleInfo = getRoleInfo(post.author?.role);
            const catColors = { announcement: '#f59e0b', event: '#22c55e', notice: '#60a5fa' };
            return (
              <div key={post._id} className="card" style={{ overflow: 'hidden', borderLeft: `4px solid ${catColors[post.category] || 'var(--accent)'}` }}>
                {post.isPinned && (
                  <div style={{ background: 'rgba(245,158,11,0.1)', padding: '6px 16px', fontSize: 11, fontWeight: 600, color: '#f59e0b' }}>
                    📌 Pinned
                  </div>
                )}
                <div style={{ padding: 18 }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <Link to={`/profile/${post.author?._id}`} className="avatar avatar-md">
                      {post.author?.avatar ? <img src={post.author.avatar} alt="" /> : getInitials(post.author?.name)}
                    </Link>
                    <div>
                      <Link to={`/profile/${post.author?._id}`} style={{ fontWeight: 700, fontSize: 14 }}>{post.author?.name}</Link>
                      <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                        <span className="role-badge" style={{ color: roleInfo.color, borderColor: roleInfo.color + '44' }}>{roleInfo.label}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{timeAgo(post.createdAt)}</span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                          background: catColors[post.category] + '22', color: catColors[post.category]
                        }}>
                          {post.category.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{post.content}</p>
                  {post.media?.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      {post.media.map((m, i) => (
                        m.type === 'video'
                          ? <video key={i} src={m.url} controls style={{ width: '100%', borderRadius: 10 }} />
                          : <img key={i} src={m.url} alt="" style={{ width: '100%', borderRadius: 10, marginTop: 8 }} />
                      ))}
                    </div>
                  )}
                  {post.visibility !== 'public' && (
                    <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 4 }}>
                      🔒 Visible to: {post.targetRoles?.join(', ') || 'specific users'}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 13, color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                    <span>❤️ {post.likes?.length || 0} likes</span>
                    <span>💬 {post.comments?.length || 0} comments</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreatePostModal
          onClose={() => setShowCreate(false)}
          onCreated={(post) => { setPosts(prev => [post, ...prev]); setShowCreate(false); }}
        />
      )}
    </div>
  );
}
