// =====================================================================================
//                          FRONTEND: components/ConnectionTest.jsx
// =====================================================================================
// Simple connection test to debug the actual issue
// =====================================================================================

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const ConnectionTest = () => {
  const [testResults, setTestResults] = useState({
    envVars: {},
    connectionTest: null,
    error: null,
    loading: true
  });

  useEffect(() => {
    const runTests = async () => {
      console.log('🔍 Starting connection tests...');
      
      // Test 1: Check environment variables
      const envVars = {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'
      };
      
      console.log('Environment variables:', envVars);
      
      try {
        // Test 2: Simple connection test
        console.log('🔗 Testing Supabase connection...');
        const { data, error } = await supabase
          .from('buildings')
          .select('count', { count: 'exact' });
        
        console.log('Connection test result:', { data, error });
        
        if (error) {
          console.error('Connection error:', error);
          setTestResults({
            envVars,
            connectionTest: 'FAILED',
            error: error.message,
            loading: false
          });
        } else {
          console.log('✅ Connection successful');
          setTestResults({
            envVars,
            connectionTest: 'SUCCESS',
            error: null,
            loading: false
          });
        }
      } catch (err) {
        console.error('Test error:', err);
        setTestResults({
          envVars,
          connectionTest: 'ERROR',
          error: err.message,
          loading: false
        });
      }
    };

    runTests();
  }, []);

  if (testResults.loading) {
    return (
      <div className="card p-6 mb-6 border-2 border-info/20 bg-info/5">
        <h3 className="text-lg font-semibold text-info mb-2">🔍 Running Connection Tests...</h3>
        <p className="text-gray-600">Please wait while we diagnose the issue...</p>
      </div>
    );
  }

  return (
    <div className="card p-6 mb-6 border-2 border-info/20 bg-info/5">
      <h3 className="text-lg font-semibold text-info mb-4">🔍 Connection Test Results</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Environment Variables:</h4>
          <div className="bg-white p-3 rounded border font-mono text-sm">
            <div>VITE_SUPABASE_URL: {testResults.envVars.VITE_SUPABASE_URL || 'MISSING'}</div>
            <div>VITE_SUPABASE_ANON_KEY: {testResults.envVars.VITE_SUPABASE_ANON_KEY}</div>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Connection Status:</h4>
          <div className={`p-3 rounded border font-semibold ${
            testResults.connectionTest === 'SUCCESS' 
              ? 'bg-success/10 text-success border-success/20' 
              : 'bg-error/10 text-error border-error/20'
          }`}>
            {testResults.connectionTest === 'SUCCESS' ? '✅ Connected Successfully' : '❌ Connection Failed'}
          </div>
        </div>
        
        {testResults.error && (
          <div>
            <h4 className="font-semibold text-error mb-2">Error Details:</h4>
            <div className="bg-error/5 border border-error/20 p-3 rounded text-sm font-mono">
              {testResults.error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionTest;