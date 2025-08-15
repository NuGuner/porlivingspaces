// Simple test page to verify React is working
import React from 'react';
import SimpleStatus from './components/SimpleStatus';

const TestPage = () => {
  return (
    <div>
      <SimpleStatus />
      <div style={{paddingTop: '100px', padding: '20px'}}>
        <h1 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '20px'}}>
          🔍 PorLivingSpaces Test Page
        </h1>
        
        <div style={{border: '2px solid #000', padding: '20px', marginBottom: '20px', backgroundColor: '#f0f0f0'}}>
          <h2>✅ React is Working</h2>
          <p>If you can see this, React is loading correctly.</p>
        </div>
        
        <div style={{border: '2px solid #000', padding: '20px', marginBottom: '20px', backgroundColor: '#ffffcc'}}>
          <h2>Environment Variables:</h2>
          <p>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL || 'NOT SET'}</p>
          <p>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}</p>
        </div>
        
        <div style={{border: '2px solid #000', padding: '20px', backgroundColor: '#ccffcc'}}>
          <h2>Next Steps:</h2>
          <p>1. Check if environment variables are loaded</p>
          <p>2. Test Supabase connection</p>
          <p>3. Check browser console for errors</p>
        </div>
      </div>
    </div>
  );
};

export default TestPage;