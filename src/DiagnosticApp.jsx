import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const DiagnosticApp = () => {
  const [status, setStatus] = useState('Initializing...');
  const [data, setData] = useState({
    buildings: 0,
    rooms: 0,
    error: null,
    envCheck: 'checking...'
  });

  useEffect(() => {
    console.log('🚀 DiagnosticApp mounted');
    
    // Check environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      setData(prev => ({ ...prev, envCheck: 'MISSING ENV VARS' }));
      setStatus('Environment variables missing');
      return;
    }
    
    setData(prev => ({ ...prev, envCheck: 'OK' }));
    setStatus('Environment OK, testing database...');
    
    // Test database connection
    const testDatabase = async () => {
      try {
        console.log('🔍 Testing database connection...');
        
        const { data: buildings, error: buildingsError } = await supabase
          .from('buildings')
          .select('*');
        
        if (buildingsError) {
          throw new Error(`Buildings: ${buildingsError.message}`);
        }
        
        const { data: rooms, error: roomsError } = await supabase
          .from('rooms')
          .select('*');
        
        if (roomsError) {
          throw new Error(`Rooms: ${roomsError.message}`);
        }
        
        setData(prev => ({
          ...prev,
          buildings: buildings?.length || 0,
          rooms: rooms?.length || 0
        }));
        
        setStatus('Database connection successful');
        console.log('✅ Database test completed', { buildings: buildings?.length, rooms: rooms?.length });
        
      } catch (error) {
        console.error('❌ Database test failed:', error);
        setData(prev => ({ ...prev, error: error.message }));
        setStatus('Database connection failed');
      }
    };
    
    testDatabase();
  }, []);

  const containerStyle = {
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  };

  const panelStyle = {
    backgroundColor: '#fff',
    border: '2px solid #333',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  };

  const alertStyle = {
    ...panelStyle,
    backgroundColor: '#fee',
    borderColor: '#f00'
  };

  const successStyle = {
    ...panelStyle,
    backgroundColor: '#efe',
    borderColor: '#0a0'
  };

  return (
    <div style={containerStyle}>
      <div style={panelStyle}>
        <h1 style={{ margin: '0 0 20px 0', color: '#333' }}>
          🔧 PorLivingSpaces Diagnostic
        </h1>
        <p style={{ fontSize: '18px', margin: '0 0 20px 0' }}>
          Status: <strong>{status}</strong>
        </p>
      </div>

      <div style={data.error ? alertStyle : successStyle}>
        <h2 style={{ margin: '0 0 15px 0' }}>📊 System Check</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                React App
              </td>
              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                ✅ Working (you can see this page)
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                Environment Variables
              </td>
              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                {data.envCheck === 'OK' ? '✅' : '❌'} {data.envCheck}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                Buildings Count
              </td>
              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                {data.buildings}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                Rooms Count
              </td>
              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                {data.rooms}
              </td>
            </tr>
            {data.error && (
              <tr>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                  Error
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd', color: '#d00' }}>
                  {data.error}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data.buildings === 0 && data.envCheck === 'OK' && !data.error && (
        <div style={alertStyle}>
          <h3 style={{ margin: '0 0 15px 0' }}>⚠️ No Data Found</h3>
          <p>Your database connection is working, but no buildings or rooms were found.</p>
          <p><strong>Possible solutions:</strong></p>
          <ul>
            <li>Your database might be empty</li>
            <li>Sample data might need to be recreated</li>
            <li>Data might have been accidentally deleted</li>
          </ul>
        </div>
      )}

      <div style={panelStyle}>
        <h3 style={{ margin: '0 0 15px 0' }}>🔍 Next Steps</h3>
        <ol>
          <li>If you see this page, React is working fine</li>
          <li>Check the System Check table above for issues</li>
          <li>If Buildings Count = 0, your database is empty</li>
          <li>If there's an error, that shows the connection problem</li>
          <li>Copy this information and report back</li>
        </ol>
        
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          <strong>Browser Console Check:</strong><br />
          Press F12 → Console tab to see detailed logs starting with 🚀 and 🔍
        </div>
      </div>
    </div>
  );
};

export default DiagnosticApp;