import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import {
  MdLockOutline,
  MdMailOutline,
  MdPersonOutline,
  MdVisibility,
  MdVisibilityOff,
  MdArrowForward,
  MdCheckCircle,
  MdShield,
  MdAdminPanelSettings
} from 'react-icons/md';

export default function Auth() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (mode === 'signup') {
      if (!name) {
        setError('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setSubmitting(true);
      const res = await signup(name, email, password);
      setSubmitting(false);

      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setError(res.error || 'Failed to create account.');
      }
    } else {
      setSubmitting(true);
      const res = await login(email, password);
      setSubmitting(false);

      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setError(res.error || 'Invalid email or password.');
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #0f172a 100%)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background glow circles */}
      <div style={{
        position: 'absolute',
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.25) 0%, rgba(124, 58, 237, 0) 70%)',
        top: '-10%',
        left: '-10%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: 450,
        height: 450,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(14, 165, 233, 0.2) 0%, rgba(14, 165, 233, 0) 70%)',
        bottom: '-10%',
        right: '-10%',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: 460,
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        borderRadius: 24,
        padding: '36px 32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: 16,
            background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)',
            color: 'white',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 30,
            boxShadow: '0 10px 20px rgba(75, 46, 131, 0.3)',
            marginBottom: 14
          }}>
            <MdAdminPanelSettings />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 }}>
            SRM College of Nursing
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, fontWeight: 500 }}>
            Administrative Control Panel
          </p>
        </div>

        {/* Tab Toggle (Sign In / Sign Up) */}
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          borderRadius: 12,
          padding: 4,
          marginBottom: 24
        }}>
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              borderRadius: 9,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              background: mode === 'signin' ? 'white' : 'transparent',
              color: mode === 'signin' ? 'var(--primary)' : '#64748b',
              boxShadow: mode === 'signin' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              borderRadius: 9,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              background: mode === 'signup' ? 'white' : 'transparent',
              color: mode === 'signup' ? 'var(--primary)' : '#64748b',
              boxShadow: mode === 'signup' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Create Admin
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#dc2626',
            padding: '11px 14px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid #fecaca'
          }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Full Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <MdPersonOutline style={{ position: 'absolute', left: 14, color: '#94a3b8', fontSize: 20 }} />
                <input
                  type="text"
                  placeholder="e.g. Dr. Suja Suresh"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 42px',
                    borderRadius: 10,
                    border: '1.5px solid #e2e8f0',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  required
                />
              </div>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
              Email Address <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <MdMailOutline style={{ position: 'absolute', left: 14, color: '#94a3b8', fontSize: 20 }} />
              <input
                type="email"
                placeholder="admin@srmnursing.edu.in"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 42px',
                  borderRadius: 10,
                  border: '1.5px solid #e2e8f0',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: mode === 'signup' ? 16 : 22 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
              Password <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <MdLockOutline style={{ position: 'absolute', left: 14, color: '#94a3b8', fontSize: 20 }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 42px 11px 42px',
                  borderRadius: 10,
                  border: '1.5px solid #e2e8f0',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: 18,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Confirm Password <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <MdLockOutline style={{ position: 'absolute', left: 14, color: '#94a3b8', fontSize: 20 }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 42px',
                    borderRadius: 10,
                    border: '1.5px solid #e2e8f0',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '13px 20px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              fontWeight: 700,
              fontSize: 15,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 8px 16px rgba(75, 46, 131, 0.25)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={e => { if (!submitting) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
          >
            {submitting ? 'Please wait...' : mode === 'signin' ? 'Sign In to Dashboard' : 'Create Account'}
            {!submitting && <MdArrowForward />}
          </button>
        </form>

        {/* Footer info */}
        <div style={{
          marginTop: 24,
          paddingTop: 18,
          borderTop: '1px solid #f1f5f9',
          textAlign: 'center',
          fontSize: 12,
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6
        }}>
          <MdShield /> Secure JWT Authentication & Encrypted Storage
        </div>
      </div>
    </div>
  );
}
