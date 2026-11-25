import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getInitials, getRoleInfo, timeAgo } from '../utils/helpers';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [academicRecords, setAcademicRecords] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [newRecord, setNewRecord] = useState({ subject: '', marks: '', grade: '', examName: '' });
  const [newClassroom, setNewClassroom] = useState({ name: '' });
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [activeClassroom, setActiveClassroom] = useState(null);
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [examFilter, setExamFilter] = useState('All');

  const isOwn = !userId || userId === currentUser._id;
  const targetId = userId || currentUser._id;

  useEffect(() => {
    Promise.all([
      api.get(`/users/${targetId}`),
      api.get(`/posts/feed`),
      api.get('/classrooms')
    ]).then(([userRes, postsRes, classroomsRes]) => {
      setProfile(userRes.data);
      setAcademicRecords(userRes.data.academicRecords || []);
      setEditForm({ name: userRes.data.name, bio: userRes.data.bio || '' });
      setPosts(postsRes.data.posts.filter(p => p.author?._id === targetId));
      setClassrooms(classroomsRes.data);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, [targetId]);

  const saveProfile = async () => {
    const res = await api.patch('/users/profile', editForm);
    setProfile(res.data);
    updateUser(res.data);
    setEditing(false);
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;
  if (!profile) return <div className="empty-state"><div className="empty-title">User not found</div></div>;

  const roleInfo = getRoleInfo(profile.role);
  const isFaculty = ['professor', 'hod'].includes(profile.role);
  const isStudent = profile.role === 'student';

  const handleAddRecord = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/users/academic-records', newRecord);
      setAcademicRecords(res.data);
      setNewRecord({ subject: '', marks: '', grade: '', examName: '' });
    } catch (err) { alert(err.response?.data?.message || 'Error adding record'); }
  };

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/classrooms', newClassroom);
      setClassrooms([...classrooms, res.data]);
      setNewClassroom({ name: '' });
    } catch (err) { alert(err.response?.data?.message || 'Error creating classroom'); }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/classrooms/${activeClassroom._id}/notes`, newNote);
      setActiveClassroom({ ...activeClassroom, notes: res.data });
      setNewNote({ title: '', content: '' });
    } catch (err) { alert(err.response?.data?.message || 'Error adding note'); }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      // Find student by email
      const searchRes = await api.get(`/users/search?q=${newStudentEmail}&role=student`);
      const student = searchRes.data.find(u => u.email.toLowerCase() === newStudentEmail.toLowerCase());
      
      if (!student) {
        alert('Student not found with this email');
        return;
      }

      const res = await api.post(`/classrooms/${activeClassroom._id}/students`, { studentId: student._id });
      const updatedClassrooms = classrooms.map(c => c._id === activeClassroom._id ? { ...c, students: [...(c.students || []), student] } : c);
      setClassrooms(updatedClassrooms);
      setActiveClassroom({ ...activeClassroom, students: [...(activeClassroom.students || []), student] });
      setNewStudentEmail('');
    } catch (err) { alert(err.response?.data?.message || 'Error adding student'); }
  };

  const filteredData = academicRecords
    .filter(r => subjectFilter === 'All' || r.subject === subjectFilter)
    .filter(r => examFilter === 'All' || r.examName === examFilter)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const subjects = ['All', ...new Set(academicRecords.map(r => r.subject))];
  const exams = ['All', ...new Set(academicRecords.map(r => r.examName))];

  return (
    <div className="page-wrapper" style={{ maxWidth: 800 }}>
      <div className="profile-header">
        <div className="profile-banner" />
        <div className="profile-info">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="profile-avatar-wrap">
              <div className="avatar avatar-xl">
                {profile.avatar ? <img src={profile.avatar} alt={profile.name} /> : getInitials(profile.name)}
              </div>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              {isOwn ? (
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>✏️ Edit Profile</button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={() => navigate(`/messages/${profile._id}`)}>
                  💬 Message
                </button>
              )}
            </div>
          </div>

          <div className="profile-name">{profile.name}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            <span className="role-badge" style={{ color: roleInfo.color, borderColor: roleInfo.color + '44' }}>
              {roleInfo.label}
            </span>
            {profile.department && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>🏛️ {profile.department}</span>}
          </div>
          {profile.bio && <p style={{ marginTop: 10, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{profile.bio}</p>}

          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {profile.registerNumber && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>🎓 {profile.registerNumber}</span>}
            {profile.year && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>📅 {profile.year}</span>}
            {profile.clubName && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>🎯 {profile.clubName}</span>}
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>📧 {profile.email}</span>
          </div>

          <div className="profile-stats">
            <div className="stat-item">
              <div className="stat-num">{posts.length}</div>
              <div className="stat-label">Posts</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">{profile.followers?.length || 0}</div>
              <div className="stat-label">Followers</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">{profile.following?.length || 0}</div>
              <div className="stat-label">Following</div>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Progress */}
      {isOwn && isStudent && (
        <div className="card" style={{ marginTop: 24, padding: 20 }}>
          <h3 style={{ fontFamily: 'Syne', marginBottom: 20 }}>📈 Academic Progress</h3>
          
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Subject</label>
              <select className="form-input" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Exam</label>
              <select className="form-input" value={examFilter} onChange={e => setExamFilter(e.target.value)}>
                {exams.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          <div style={{ height: 300, width: '100%', marginBottom: 24 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="examName" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="marks" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Marks" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ padding: 16, background: 'var(--bg-body)', borderRadius: 12 }}>
            <h4 style={{ marginBottom: 12, fontSize: 14 }}>Add New Record</h4>
            <form onSubmit={handleAddRecord} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <input className="form-input" placeholder="Subject" value={newRecord.subject} onChange={e => setNewRecord({ ...newRecord, subject: e.target.value })} required />
              <input className="form-input" placeholder="Exam Name" value={newRecord.examName} onChange={e => setNewRecord({ ...newRecord, examName: e.target.value })} required />
              <input className="form-input" type="number" placeholder="Marks" value={newRecord.marks} onChange={e => setNewRecord({ ...newRecord, marks: e.target.value })} required />
              <input className="form-input" placeholder="Grade (Optional)" value={newRecord.grade} onChange={e => setNewRecord({ ...newRecord, grade: e.target.value })} />
              <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2' }}>Add Record</button>
            </form>
          </div>
        </div>
      )}

      {/* Classroom Management */}
      {isOwn && isFaculty && (
        <div className="card" style={{ marginTop: 24, padding: 20 }}>
          <h3 style={{ fontFamily: 'Syne', marginBottom: 20 }}>🏫 Classrooms</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 24 }}>
            <div style={{ borderRight: '1px solid var(--border-color)', paddingRight: 20 }}>
              <form onSubmit={handleCreateClassroom} style={{ marginBottom: 20 }}>
                <input className="form-input" placeholder="New Class Name" value={newClassroom.name} onChange={e => setNewClassroom({ ...newClassroom, name: e.target.value })} required />
                <button type="submit" className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 8 }}>Create Class</button>
              </form>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {classrooms.map(c => (
                  <div 
                    key={c._id} 
                    className={`classroom-item ${activeClassroom?._id === c._id ? 'active' : ''}`}
                    onClick={() => setActiveClassroom(c)}
                    style={{ 
                      padding: '10px 12px', 
                      borderRadius: 8, 
                      cursor: 'pointer',
                      background: activeClassroom?._id === c._id ? 'var(--primary-light)' : 'transparent',
                      color: activeClassroom?._id === c._id ? 'var(--primary)' : 'inherit',
                      fontSize: 14
                    }}
                  >
                    {c.name}
                  </div>
                ))}
              </div>
            </div>

            <div>
              {activeClassroom ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h4 style={{ margin: 0 }}>{activeClassroom.name}</h4>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{activeClassroom.students?.length || 0} Students</span>
                  </div>

                  <div style={{ marginBottom: 24, padding: 16, background: 'var(--bg-body)', borderRadius: 12 }}>
                    <h5 style={{ fontSize: 13, marginBottom: 8 }}>Add Student</h5>
                    <form onSubmit={handleAddStudent} style={{ display: 'flex', gap: 8 }}>
                      <input className="form-input" placeholder="Student Email" value={newStudentEmail} onChange={e => setNewStudentEmail(e.target.value)} required />
                      <button type="submit" className="btn btn-secondary btn-sm">Add</button>
                    </form>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <h5 style={{ fontSize: 13, marginBottom: 8 }}>Add Note</h5>
                    <form onSubmit={handleAddNote}>
                      <input className="form-input" placeholder="Note Title" value={newNote.title} onChange={e => setNewNote({ ...newNote, title: e.target.value })} required style={{ marginBottom: 8 }} />
                      <textarea className="form-textarea" placeholder="Note Content" value={newNote.content} onChange={e => setNewNote({ ...newNote, content: e.target.value })} required rows={3} style={{ marginBottom: 8 }} />
                      <button type="submit" className="btn btn-primary btn-sm">Post Note</button>
                    </form>
                  </div>

                  <div>
                    <h5 style={{ fontSize: 13, marginBottom: 12 }}>Recent Notes</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {(activeClassroom.notes || []).slice().reverse().map((note, idx) => (
                        <div key={idx} style={{ padding: 12, border: '1px solid var(--border-color)', borderRadius: 8 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{note.title}</div>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>{note.content}</p>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{timeAgo(note.createdAt)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Select a classroom to view details and notes
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student View Classrooms */}
      {isOwn && isStudent && (
        <div className="card" style={{ marginTop: 24, padding: 20 }}>
          <h3 style={{ fontFamily: 'Syne', marginBottom: 20 }}>📚 My Classrooms</h3>
          {classrooms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>You are not enrolled in any classrooms yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {classrooms.map(c => (
                <div key={c._id} className="classroom-card" style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: 16, background: 'var(--bg-body)', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Teacher: {c.teacher?.name}</div>
                  </div>
                  <div style={{ padding: 16 }}>
                    <h5 style={{ fontSize: 13, marginBottom: 12 }}>Class Notes</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {c.notes?.length > 0 ? (
                        c.notes.slice().reverse().map((note, idx) => (
                          <div key={idx} style={{ padding: 12, background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{note.title}</div>
                            <p style={{ fontSize: 13, margin: '4px 0' }}>{note.content}</p>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(note.createdAt)}</div>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No notes shared yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Posts */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontFamily: 'Syne', marginBottom: 16 }}>Posts</h3>
        {posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <div className="empty-title">No posts yet</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {posts.map(post => (
              <div key={post._id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="category-tag">{post.category}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{timeAgo(post.createdAt)}</span>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.65 }}>{post.content}</p>
                <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 13, color: 'var(--text-muted)' }}>
                  <span>❤️ {post.likes?.length || 0}</span>
                  <span>💬 {post.comments?.length || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditing(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Edit Profile</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setEditing(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input className="form-input" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea className="form-textarea" value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} rows={4} placeholder="Tell everyone about yourself..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveProfile}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
