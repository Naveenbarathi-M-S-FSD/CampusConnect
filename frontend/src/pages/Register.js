import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES, DEPARTMENTS } from '../utils/helpers';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: '', department: '', registerNumber: '', year: '', clubName: '', bio: ''
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    setError(''); setLoading(true);
    try {
      await register(form);
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-blob" style={{ width: 500, height: 500, background: 'var(--accent-2)', top: -150, right: -100 }} />
      <div className="auth-bg-blob" style={{ width: 350, height: 350, background: 'var(--accent)', bottom: -100, left: -80 }} />

      <div className="auth-card" style={{ maxWidth: 500 }}>
        <div className="auth-logo">
          <div className="logo-mark">C</div>
          <div className="logo-text font-display" style={{ fontSize: 20, fontWeight: 700 }}>
            Campus<span style={{ color: 'var(--accent)' }}>Connect</span>
          </div>
        </div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join your campus community</p>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 4,
              background: s <= step ? 'var(--accent)' : 'var(--border)',
              transition: 'background 0.3s'
            }} />
          ))}
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--danger)' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" placeholder="Your full name" value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="you@college.edu" value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)} required>
                  <option value="">Select your role</option>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-select" value={form.department} onChange={e => set('department', e.target.value)}>
                  <option value="">Select department (optional)</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <button type="button" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} onClick={() => { if (!form.name || !form.email || !form.role) { setError('Please fill all required fields'); return; } setError(''); setStep(2); }}>
                Continue →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" placeholder="Create a strong password" value={form.password} onChange={e => set('password', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input className="form-input" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required />
              </div>
              {form.role === 'student' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Register Number</label>
                    <input className="form-input" placeholder="e.g. 21CS001" value={form.registerNumber} onChange={e => set('registerNumber', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <select className="form-select" value={form.year} onChange={e => set('year', e.target.value)}>
                      <option value="">Select year</option>
                      {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                </>
              )}
              {form.role === 'club_member' && (
                <div className="form-group">
                  <label className="form-label">Club Name</label>
                  <input className="form-input" placeholder="e.g. Coding Club" value={form.clubName} onChange={e => set('clubName', e.target.value)} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Bio (optional)</label>
                <textarea className="form-textarea" placeholder="Tell something about yourself..." value={form.bio} onChange={e => set('bio', e.target.value)} rows={2} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(1)}>← Back</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', padding: '12px' }} disabled={loading}>
                  {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Creating...</> : 'Create Account'}
                </button>
              </div>
            </>
          )}
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
