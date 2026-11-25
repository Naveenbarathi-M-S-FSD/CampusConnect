import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getInitials, getRoleInfo, timeAgo, CATEGORIES } from '../utils/helpers';
import CreatePostModal from '../components/CreatePostModal';

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchPosts = useCallback(async (p = 1, reset = false) => {
    try {
      setLoading(true);
      const res = await api.get(`/posts/feed?page=${p}&limit=10`);
      const newPosts = res.data.posts;
      setPosts(prev => reset ? newPosts : [...prev, ...newPosts]);
      setHasMore(p < res.data.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(1, true); }, [fetchPosts]);

  const handlePostCreated = (post) => {
    setPosts(prev => [post, ...prev]);
    setShowCreate(false);
  };

  const handleLike = async (postId) => {
    try {
      const res = await api.post(`/posts/${postId}/like`);
      setPosts(prev => prev.map(p => p._id === postId
        ? { ...p, likes: res.data.liked ? [...p.likes, user._id] : p.likes.filter(id => id !== user._id) }
        : p
      ));
    } catch (err) { console.error(err); }
  };

  const handleComment = async (postId, content) => {
    if (!content.trim()) return;
    try {
      const res = await api.post(`/posts/${postId}/comment`, { content });
      setPosts(prev => prev.map(p => p._id === postId
        ? { ...p, comments: [...p.comments, res.data] }
        : p
      ));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts(prev => prev.filter(p => p._id !== postId));
    } catch (err) { console.error(err); }
  };

  const filteredPosts = filter === 'all' ? posts : posts.filter(p => p.category === filter);

  return (
    <div className="page-wrapper">
      <div className="feed-layout">
        {/* Main Feed */}
        <div className="feed-main">
          {/* Create Post Trigger */}
          <div className="create-post-card">
            <div className="create-post-trigger" onClick={() => setShowCreate(true)}>
              <div className="avatar avatar-sm">{user?.avatar ? <img src={user.avatar} alt="" /> : getInitials(user?.name)}</div>
              <span>Share something with your campus...</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {['📢 Announce', '🎉 Event', '📌 Notice', '🏆 Achievement'].map(label => (
                <button key={label} className="btn btn-secondary btn-sm" onClick={() => setShowCreate(true)}>{label}</button>
              ))}
            </div>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('all')}>All</button>
            {CATEGORIES.map(c => (
              <button key={c.value} className={`btn btn-sm ${filter === c.value ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(c.value)} style={{ whiteSpace: 'nowrap' }}>
                {c.label}
              </button>
            ))}
          </div>

          {/* Posts */}
          {loading && posts.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
          ) : filteredPosts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div className="empty-title">No posts yet</div>
              <div className="empty-desc">Be the first to share something!</div>
            </div>
          ) : (
            filteredPosts.map(post => (
              <PostCard
                key={post._id}
                post={post}
                currentUser={user}
                onLike={handleLike}
                onComment={handleComment}
                onDelete={handleDelete}
              />
            ))
          )}

          {hasMore && !loading && (
            <div style={{ textAlign: 'center', padding: 16 }}>
              <button className="btn btn-secondary" onClick={() => { const next = page + 1; setPage(next); fetchPosts(next); }}>
                Load More
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="sidebar-right">
          <QuickStats user={user} />
          <TrendingWidget />
        </div>
      </div>

      {showCreate && (
        <CreatePostModal onClose={() => setShowCreate(false)} onCreated={handlePostCreated} />
      )}
    </div>
  );
}

function PostCard({ post, currentUser, onLike, onComment, onDelete }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const roleInfo = getRoleInfo(post.author?.role);
  const isLiked = post.likes?.includes(currentUser._id);
  const isOwner = post.author?._id === currentUser._id;

  const categoryEmoji = { announcement: '📢', event: '🎉', notice: '📌', achievement: '🏆', task: '📋', general: '💬' };

  return (
    <article className={`post-card ${post.isPinned ? 'pinned' : ''}`}>
      {post.isPinned && <div className="pin-indicator">📌 Pinned Post</div>}

      <div className="post-header">
        <Link to={`/profile/${post.author?._id}`} className="avatar avatar-md">
          {post.author?.avatar ? <img src={post.author.avatar} alt="" /> : getInitials(post.author?.name)}
        </Link>
        <div className="post-author-info">
          <Link to={`/profile/${post.author?._id}`} className="post-author-name">{post.author?.name}</Link>
          <div className="post-meta">
            <span className="role-badge" style={{ color: roleInfo.color, borderColor: roleInfo.color + '44', fontSize: 11 }}>
              {roleInfo.label}
            </span>
            {post.author?.department && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{post.author.department}</span>}
            <span className="post-time">· {timeAgo(post.createdAt)}</span>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
          <span className="category-tag">{categoryEmoji[post.category]} {post.category}</span>
          {isOwner && (
            <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 16 }} onClick={() => onDelete(post._id)} title="Delete">🗑️</button>
          )}
        </div>
      </div>

      <div className="post-body">
        {post.media?.length > 0 && (
          <div className="post-media">
            {post.media.map((m, i) => (
              m.type === 'video'
                ? <video key={i} src={m.url} controls />
                : <img key={i} src={m.url} alt="post media" loading="lazy" />
            ))}
          </div>
        )}
        <p className="post-content">{post.content}</p>
        {post.visibility !== 'public' && (
          <div className="visibility-tag">
            {post.visibility === 'role_based' ? `🔒 Visible to: ${post.targetRoles?.join(', ')}` : '🔐 Private'}
          </div>
        )}
      </div>

      <div className="post-actions">
        <button className={`action-btn ${isLiked ? 'liked' : ''}`} onClick={() => onLike(post._id)}>
          {isLiked ? '❤️' : '🤍'} {post.likes?.length || 0}
        </button>
        <button className="action-btn" onClick={() => setShowComments(!showComments)}>
          💬 {post.comments?.length || 0}
        </button>
        <button className="action-btn" style={{ marginLeft: 'auto' }}>🔗 Share</button>
      </div>

      {showComments && (
        <div className="comments-section">
          {post.comments?.map((c, i) => (
            <div className="comment-item" key={i}>
              <Link to={`/profile/${c.author?._id}`} className="avatar avatar-xs">
                {c.author?.avatar ? <img src={c.author.avatar} alt="" /> : getInitials(c.author?.name)}
              </Link>
              <div className="comment-bubble">
                <div className="comment-author">{c.author?.name}</div>
                <div className="comment-text">{c.content}</div>
              </div>
            </div>
          ))}
          <div className="comment-input-row">
            <div className="avatar avatar-xs">{getInitials(currentUser?.name)}</div>
            <input
              className="form-input" style={{ flex: 1 }}
              placeholder="Write a comment..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { onComment(post._id, commentText); setCommentText(''); } }}
            />
            <button className="btn btn-primary btn-sm" onClick={() => { onComment(post._id, commentText); setCommentText(''); }}>Send</button>
          </div>
        </div>
      )}
    </article>
  );
}

function QuickStats({ user }) {
  const roleInfo = getRoleInfo(user?.role);
  return (
    <div className="widget-card">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
        <div className="avatar avatar-md">{getInitials(user?.name)}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{user?.name}</div>
          <div className="role-badge" style={{ color: roleInfo.color, borderColor: roleInfo.color + '44', marginTop: 4 }}>{roleInfo.label}</div>
        </div>
      </div>
      {user?.department && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>🏛️ {user.department}</div>}
      <Link to="/profile" className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>View Profile</Link>
    </div>
  );
}

function TrendingWidget() {
  const tags = ['#Hackathon2025', '#Placement', '#FestDay', '#Seminar', '#Sports'];
  return (
    <div className="widget-card">
      <div className="widget-title">🔥 Trending</div>
      {tags.map(t => (
        <div key={t} style={{ padding: '6px 0', fontSize: 13, color: 'var(--accent)', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)' }}>
          {t}
        </div>
      ))}
    </div>
  );
}
