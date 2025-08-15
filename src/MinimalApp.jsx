// Minimal App to test what's preventing main components from rendering
import React, { useState, useEffect } from 'react';
import SimpleStatus from './components/SimpleStatus';
import { supabase } from './supabaseClient';

const MinimalApp = () => {
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      console.log('📋 Minimal App: Starting data fetch...');
      
      try {
        const { data: buildingsData, error: buildingsError } = await supabase
          .from('buildings')
          .select('*');
          
        if (buildingsError) {
          console.error('Buildings error:', buildingsError);
          setError(`Buildings: ${buildingsError.message}`);
        } else {
          console.log('✅ Buildings:', buildingsData);
          setBuildings(buildingsData || []);
        }

        const { data: roomsData, error: roomsError } = await supabase
          .from('rooms')
          .select('*');
          
        if (roomsError) {
          console.error('Rooms error:', roomsError);
          setError(`Rooms: ${roomsError.message}`);
        } else {
          console.log('✅ Rooms:', roomsData);
          setRooms(roomsData || []);
        }

        setLoading(false);
        console.log('✅ Minimal App: Data fetch completed');
        
      } catch (e) {
        console.error('Minimal App error:', e);
        setError(`Error: ${e.message}`);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const createSampleData = async () => {
    console.log('🎯 Creating sample data...');
    try {
      const { data: building, error: buildingError } = await supabase
        .from('buildings')
        .insert([{ name: 'Test Building' }])
        .select();

      if (buildingError) {
        console.error('Building creation error:', buildingError);
        setError(`Create building failed: ${buildingError.message}`);
        return;
      }
      
      console.log('✅ Building created:', building);
      setBuildings([building[0]]);
      setError('');
      
    } catch (error) {
      console.error('Sample data error:', error);
      setError(`Sample data failed: ${error.message}`);
    }
  };

  // Simple inline styles to ensure visibility
  const containerStyle = {
    paddingTop: '80px',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  };

  const cardStyle = {
    border: '2px solid #333',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    backgroundColor: '#f9f9f9'
  };

  const buttonStyle = {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px'
  };

  return (
    <div>
      <SimpleStatus />
      <div style={containerStyle}>
        <h1 style={{fontSize: '32px', marginBottom: '20px'}}>
          🏢 PorLivingSpaces - Minimal Version
        </h1>
        
        <div style={cardStyle}>
          <h2>📊 Data Status</h2>
          <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
          <p><strong>Buildings:</strong> {buildings.length}</p>
          <p><strong>Rooms:</strong> {rooms.length}</p>
          {error && <p style={{color: 'red'}}><strong>Error:</strong> {error}</p>}
        </div>
        
        {!loading && buildings.length === 0 && (
          <div style={{...cardStyle, backgroundColor: '#fff3cd', borderColor: '#ffc107'}}>
            <h2>🎯 No Data Found</h2>
            <p>Your database is empty. Create sample data to test the application.</p>
            <button 
              onClick={createSampleData}
              style={buttonStyle}
            >
              Create Sample Building
            </button>
          </div>
        )}
        
        {buildings.length > 0 && (
          <div style={{...cardStyle, backgroundColor: '#d1ecf1', borderColor: '#bee5eb'}}>
            <h2>✅ Success!</h2>
            <p>You have {buildings.length} building(s) and {rooms.length} room(s).</p>
            <p>The application is working correctly!</p>
          </div>
        )}
        
        <div style={cardStyle}>
          <h2>🔍 Debug Info</h2>
          <p>If you can see this minimal app, React is working fine.</p>
          <p>Check the browser console (F12) for detailed logs.</p>
          <pre style={{backgroundColor: '#e9ecef', padding: '10px', borderRadius: '4px'}}>
            Buildings: {JSON.stringify(buildings, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default MinimalApp;