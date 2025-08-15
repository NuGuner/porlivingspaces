import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const SignupForm = ({ onToggleMode }) => {
  const { signUp, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const validateForm = () => {
    const errors = {};

    // Full name validation
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const { user, error } = await signUp(
      formData.email, 
      formData.password, 
      formData.fullName
    );

    if (!error && user) {
      setShowSuccess(true);
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

  const errorInputStyle = {
    ...inputStyle,
    borderColor: '#ef4444'
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

  if (showSuccess) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#059669', 
            margin: '0 0 16px 0' 
          }}>
            ✅ Account Created!
          </h1>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '16px', 
            lineHeight: '1.5',
            margin: 0 
          }}>
            Your account has been created successfully!<br/>
            Please check your email to verify your account before signing in.
          </p>
        </div>

        <div style={{
          backgroundColor: '#dcfce7',
          color: '#166534',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          fontSize: '14px'
        }}>
          📧 A verification email has been sent to<br/>
          <strong>{formData.email}</strong>
        </div>

        <button
          onClick={onToggleMode}
          style={buttonStyle}
        >
          🔐 Go to Sign In
        </button>
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
          Create your admin account
        </p>
      </div>

      <form onSubmit={handleSignup}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#374151'
          }}>
            👤 Full Name
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            style={validationErrors.fullName ? errorInputStyle : inputStyle}
            placeholder="Enter your full name"
          />
          {validationErrors.fullName && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
              {validationErrors.fullName}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
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
            style={validationErrors.email ? errorInputStyle : inputStyle}
            placeholder="Enter your email"
          />
          {validationErrors.email && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
              {validationErrors.email}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
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
            style={validationErrors.password ? errorInputStyle : inputStyle}
            placeholder="Create a strong password"
          />
          {validationErrors.password && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
              {validationErrors.password}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#374151'
          }}>
            🔒 Confirm Password
          </label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            style={validationErrors.confirmPassword ? errorInputStyle : inputStyle}
            placeholder="Confirm your password"
          />
          {validationErrors.confirmPassword && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
              {validationErrors.confirmPassword}
            </div>
          )}
        </div>

        <div style={{ 
          backgroundColor: '#f3f4f6', 
          padding: '12px', 
          borderRadius: '6px', 
          marginBottom: '24px' 
        }}>
          <p style={{ 
            fontSize: '12px', 
            color: '#6b7280', 
            margin: 0,
            lineHeight: '1.4'
          }}>
            📋 Password Requirements:<br/>
            • At least 6 characters<br/>
            • One uppercase letter<br/>
            • One lowercase letter<br/>
            • One number
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            ...buttonStyle,
            backgroundColor: loading ? '#9ca3af' : '#2563eb'
          }}
        >
          {loading ? '🔄 Creating Account...' : '🎯 Create Account'}
        </button>
      </form>

      <div style={{ textAlign: 'center' }}>
        <span style={{ color: '#6b7280', fontSize: '14px' }}>
          Already have an account?{' '}
          <span onClick={onToggleMode} style={linkStyle}>
            Sign in
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

export default SignupForm;