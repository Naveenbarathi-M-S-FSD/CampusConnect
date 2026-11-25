import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getInitials, getRoleInfo, timeAgo } from '../utils/helpers';

export default function Messages() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { userId } = useParams();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    api.get('/messages/recent').then(res => setChats(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (userId) loadConversation(userId);
  }, [userId]);

  useEffect(() => {
    if (socket && activeChat) {
      const roomId = [user._id, activeChat._id].sort().join('_');
      socket.emit('join_room', roomId);
      socket.on('receive_message', (msg) => {
        setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
      });
      return () => socket.off('receive_message');
    }
  }, [socket, activeChat, user._id]);

  useEffect(scrollToBottom, [messages]);

  const loadConversation = async (uid) => {
    setLoadingMsgs(true);
    try {
      const [userRes, msgsRes] = await Promise.all([
        api.get(`/users/${uid}`),
        api.get(`/messages/conversation/${uid}`)
      ]);
      setActiveChat(userRes.data);
      setMessages(msgsRes.data);
    } catch (err) { console.error(err); }
    finally { setLoadingMsgs(false); }
  };

  const handleSearch = async (q) => {
    setSearchQ(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const res = await api.get(`/users/search?q=${q}`);
    setSearchResults(res.data.filter(u => u._id !== user._id));
  };

  const startChat = (u) => {
    setActiveChat(u);
    setShowSearch(false);
    setSearchQ('');
    setSearchResults([]);
    navigate(`/messages/${u._id}`);
    loadConversation(u._id);
  };

  const sendMessage = async () => {
    if (!text.trim() || !activeChat) return;
    const msgText = text;
    setText('');
    try {
      await api.post('/messages/send', { receiverId: activeChat._id, content: msgText });
      api.get('/messages/recent').then(res => setChats(res.data));
    } catch (err) { console.error(err); }
  };

  const roleInfo = activeChat ? getRoleInfo(activeChat.role) : null;

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex' }}>
      {/* Chat List */}
      <div className="chat-list" style={{ width: 300, flexShrink: 0 }}>
        <div className="chat-list-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Messages</span>
            <button className="btn btn-primary btn-sm" onClick={() => setShowSearch(!showSearch)}>✏️ New</button>
          </div>
          {showSearch && (
            <div style={{ marginTop: 10 }}>
              <input
                className="form-input" placeholder="Search people..."
                value={searchQ} onChange={e => handleSearch(e.target.value)}
                autoFocus
              />
              {searchResults.length > 0 && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, marginTop: 4, overflow: 'hidden' }}>
                  {searchResults.map(u => (
                    <div key={u._id} className="chat-item" onClick={() => startChat(u)}>
                      <div className="avatar avatar-sm">{getInitials(u.name)}</div>
                      <div className="chat-info">
                        <div className="chat-name">{u.name}</div>
                        <div className="chat-preview" style={{ color: getRoleInfo(u.role).color }}>{getRoleInfo(u.role).label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {chats.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <div className="empty-icon">💬</div>
            <div className="empty-title">No conversations</div>
            <div className="empty-desc">Start chatting with someone</div>
          </div>
        ) : (
          chats.map(chat => (
            <div
              key={chat.roomId}
              className={`chat-item ${activeChat?._id === chat.user?._id ? 'active' : ''}`}
              onClick={() => startChat(chat.user)}
            >
              <div className="avatar avatar-md" style={{ position: 'relative' }}>
                {chat.user?.avatar ? <img src={chat.user.avatar} alt="" /> : getInitials(chat.user?.name)}
              </div>
              <div className="chat-info">
                <div className="chat-name">{chat.user?.name}</div>
                <div className="chat-preview">{chat.lastMessage?.content}</div>
              </div>
              <div className="chat-meta">
                <div className="chat-time">{timeAgo(chat.lastMessage?.createdAt)}</div>
                {chat.unread > 0 && (
                  <div className="nav-badge">{chat.unread}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Chat Window */}
      <div className="chat-window" style={{ flex: 1, display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border)' }}>
        {activeChat ? (
          <>
            <div className="chat-topbar">
              <div className="avatar avatar-md">{activeChat.avatar ? <img src={activeChat.avatar} alt="" /> : getInitials(activeChat.name)}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{activeChat.name}</div>
                <div style={{ fontSize: 12, color: roleInfo?.color }}>{roleInfo?.label}</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
                {activeChat.department}
              </div>
            </div>

            <div className="messages-area">
              {loadingMsgs ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
              ) : messages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👋</div>
                  <div className="empty-title">Start the conversation</div>
                  <div className="empty-desc">Send a message to {activeChat.name}</div>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isOwn = msg.sender?._id === user._id || msg.sender === user._id;
                  return (
                    <div key={msg._id || i} className={`message-row ${isOwn ? 'own' : ''}`}>
                      {!isOwn && (
                        <div className="avatar avatar-xs">{getInitials(activeChat.name)}</div>
                      )}
                      <div>
                        <div className="message-bubble">{msg.content}</div>
                        <div className="message-time">{timeAgo(msg.createdAt)}</div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              <input
                className="form-input" style={{ flex: 1 }}
                placeholder={`Message ${activeChat.name}...`}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              />
              <button className="btn btn-primary" onClick={sendMessage} disabled={!text.trim()}>Send →</button>
            </div>
          </>
        ) : (
          <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="empty-icon">💬</div>
            <div className="empty-title">Select a conversation</div>
            <div className="empty-desc">Choose someone to message or start a new chat</div>
          </div>
        )}
      </div>
    </div>
  );
}
