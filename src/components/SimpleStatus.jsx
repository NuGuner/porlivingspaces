// =====================================================================================
//                          FRONTEND: components/SimpleStatus.jsx
// =====================================================================================
// Simple always-visible status component for debugging
// =====================================================================================

import React, { useState, useEffect } from 'react';

const SimpleStatus = () => {
  const [status, setStatus] = useState('App Loading...');
  const [envCheck, setEnvCheck] = useState('Checking...');
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🚀 SimpleStatus component mounted');
    
    try {
      // Check environment variables
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      console.log('Environment check:', {
        url: supabaseUrl ? 'SET' : 'MISSING',
        key: supabaseKey ? 'SET' : 'MISSING'
      });
      
      if (!supabaseUrl || !supabaseKey) {
        setEnvCheck('❌ Environment variables MISSING');
        setError('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set');
      } else {
        setEnvCheck('✅ Environment variables loaded');
      }
      
      setStatus('✅ React App is working');
      
    } catch (err) {
      console.error('SimpleStatus error:', err);
      setError(err.message);
      setStatus('❌ Error in React App');
    }
  }, []);

  // Use inline styles to ensure it's always visible
  const containerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fee2e2',
    border: '2px solid #dc2626',
    padding: '16px',
    fontSize: '14px',
    fontFamily: 'monospace',
    zIndex: 9999,
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  };

  const titleStyle = {
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: '8px'
  };

  const infoStyle = {
    marginBottom: '4px',
    color: '#374151'
  };

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>🔍 DIAGNOSTIC PANEL - Always Visible</div>
      <div style={infoStyle}>React Status: {status}</div>
      <div style={infoStyle}>Environment: {envCheck}</div>
      {error && (
        <div style={{...infoStyle, color: '#dc2626', fontWeight: 'bold'}}>
          Error: {error}
        </div>
      )}
      <div style={{...infoStyle, fontSize: '12px', marginTop: '8px', color: '#6b7280'}}>
        If you see this, the React app is loading. Check browser console for more details.
      </div>
    </div>
  );
};

export default SimpleStatus;