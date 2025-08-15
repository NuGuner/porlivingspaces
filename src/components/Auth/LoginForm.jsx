import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm = ({ onToggleMode }) => {
  const { signIn, resetPassword, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await signIn(formData.email, formData.password);
    if (!error) {
      // Login successful - AuthContext will handle navigation
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const { error } = await resetPassword(resetEmail);
    if (!error) {
      setResetMessage('Password reset email sent! Check your inbox.');
      setShowForgotPassword(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
    backgroundColor: '#ffffff'
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px 24px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginBottom: '16px'
  };

  const linkStyle = {
    color: '#2563eb',
    textDecoration: 'none',
    fontSize: '14px',
    cursor: 'pointer'
  };

  if (showForgotPassword) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#1f2937', 
            margin: '0 0 8px 0' 
          }}>
            🔑 Reset Password
          </h1>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '16px', 
            margin: 0 
          }}>
            Enter your email to receive a password reset link
          </p>
        </div>

        <form onSubmit={handleForgotPassword}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#374151'
            }}>
              📧 Email Address
            </label>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              style={inputStyle}
              placeholder="Enter your email address"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...buttonStyle,
              backgroundColor: loading ? '#9ca3af' : '#2563eb'
            }}
          >
            {loading ? '🔄 Sending...' : '📧 Send Reset Link'}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <span
            onClick={() => setShowForgotPassword(false)}
            style={linkStyle}
          >
            ← Back to Login
          </span>
        </div>

        {resetMessage && (
          <div style={{
            backgroundColor: '#dcfce7',
            color: '#166534',
            padding: '12px',
            borderRadius: '6px',
            marginTop: '16px',
            textAlign: 'center',
            fontSize: '14px'
          }}>
            ✅ {resetMessage}
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '6px',
            marginTop: '16px',
            textAlign: 'center',
            fontSize: '14px'
          }}>
            ❌ {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#ffffff',
      padding: '40px',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      width: '100%',
      maxWidth: '400px'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          color: '#1f2937', 
          margin: '0 0 8px 0' 
        }}>
          🏢 PorLivingSpaces
        </h1>
        <p style={{ 
          color: '#6b7280', 
          fontSize: '16px', 
          margin: 0 
        }}>
          Sign in to your account
        </p>
      </div>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#374151'
          }}>
            📧 Email Address
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            style={inputStyle}
            placeholder="Enter your email"
            required
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#374151'
          }}>
            🔒 Password
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            style={inputStyle}
            placeholder="Enter your password"
            required
          />
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          marginBottom: '24px' 
        }}>
          <span
            onClick={() => setShowForgotPassword(true)}
            style={linkStyle}
          >
            Forgot password?
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            ...buttonStyle,
            backgroundColor: loading ? '#9ca3af' : '#2563eb'
          }}
        >
          {loading ? '🔄 Signing in...' : '🔐 Sign In'}
        </button>
      </form>

      <div style={{ textAlign: 'center' }}>
        <span style={{ color: '#6b7280', fontSize: '14px' }}>
          Don't have an account?{' '}
          <span onClick={onToggleMode} style={linkStyle}>
            Sign up
          </span>
        </span>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          padding: '12px',
          borderRadius: '6px',
          marginTop: '16px',
          textAlign: 'center',
          fontSize: '14px'
        }}>
          ❌ {error}
        </div>
      )}
    </div>
  );
};

export default LoginForm;