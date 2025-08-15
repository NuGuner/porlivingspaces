// Working App based on successful minimal app
import React, { useState, useEffect } from 'react';
import SimpleStatus from './components/SimpleStatus';
import { supabase } from './supabaseClient';

const WorkingApp = () => {
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      console.log('🔄 WorkingApp: Starting data fetch...');
      
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
          if (buildingsData && buildingsData.length > 0) {
            setSelectedBuilding(buildingsData[0].id);
          }
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
        console.log('✅ WorkingApp: Data fetch completed');
        
      } catch (e) {
        console.error('WorkingApp error:', e);
        setError(`Error: ${e.message}`);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const createSampleData = async () => {
    console.log('🎯 Creating additional sample data...');
    try {
      const { data: building, error: buildingError } = await supabase
        .from('buildings')
        .insert([{ name: 'อาคาร A (Sample)' }])
        .select();

      if (buildingError) {
        console.error('Building creation error:', buildingError);
        setError(`Create building failed: ${buildingError.message}`);
        return;
      }
      
      console.log('✅ New building created:', building);
      
      // Create sample rooms
      const buildingId = building[0].id;
      const { data: newRooms, error: roomsError } = await supabase
        .from('rooms')
        .insert([
          {
            room_number: 'A101',
            building_id: buildingId,
            tenant_name: 'สมชาย ใจดี',
            tenant_address: '123 ถนนสุขุมวิท กรุงเทพฯ',
            tenant_phone: '081-234-5678',
            tenant_id_card: '1234567890123',
            rent_price: 8000,
            water_meter: 150,
            electric_meter: 220,
            status: 'occupied',
            is_overdue: false,
            current_bill: null,
            history: []
          },
          {
            room_number: 'A102',
            building_id: buildingId,
            tenant_name: null,
            tenant_address: null,
            tenant_phone: null,
            tenant_id_card: null,
            rent_price: 7500,
            water_meter: 0,
            electric_meter: 0,
            status: 'vacant',
            is_overdue: false,
            current_bill: null,
            history: []
          }
        ])
        .select();

      if (roomsError) {
        console.error('Rooms creation error:', roomsError);
        setError(`Create rooms failed: ${roomsError.message}`);
        return;
      }

      console.log('✅ New rooms created:', newRooms);
      
      // Refresh data
      setBuildings(prev => [...prev, building[0]]);
      setRooms(prev => [...prev, ...(newRooms || [])]);
      setError('');
      
    } catch (error) {
      console.error('Sample data error:', error);
      setError(`Sample data failed: ${error.message}`);
    }
  };

  // Simple styles that work
  const containerStyle = {
    paddingTop: '80px',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const cardStyle = {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const headerStyle = {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px'
  };

  const buttonStyle = {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    marginRight: '10px',
    marginBottom: '10px'
  };

  const statsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '20px'
  };

  const statCardStyle = {
    ...cardStyle,
    textAlign: 'center',
    backgroundColor: '#f8f9fa'
  };

  // Filter rooms for selected building
  const currentRooms = selectedBuilding 
    ? rooms.filter(room => room.building_id === selectedBuilding)
    : [];

  return (
    <div>
      <SimpleStatus />
      <div style={containerStyle}>
        
        {/* Header */}
        <div style={headerStyle}>
          <h1 style={{margin: 0, fontSize: '28px'}}>
            🏢 PorLivingSpaces - Rental Management System
          </h1>
          <p style={{margin: '10px 0 0 0', opacity: 0.9}}>
            Professional Property Management Dashboard
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{...cardStyle, textAlign: 'center'}}>
            <h2>⏳ Loading...</h2>
            <p>Fetching your property data...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={{...cardStyle, backgroundColor: '#fee', borderColor: '#fcc'}}>
            <h2 style={{color: '#c33'}}>⚠️ Error</h2>
            <p style={{color: '#c33'}}>{error}</p>
          </div>
        )}

        {/* Statistics */}
        {!loading && (
          <div style={statsStyle}>
            <div style={statCardStyle}>
              <h3 style={{margin: 0, color: '#2563eb'}}>🏢 Buildings</h3>
              <p style={{fontSize: '32px', margin: '10px 0', fontWeight: 'bold'}}>
                {buildings.length}
              </p>
            </div>
            <div style={statCardStyle}>
              <h3 style={{margin: 0, color: '#2563eb'}}>🏠 Total Rooms</h3>
              <p style={{fontSize: '32px', margin: '10px 0', fontWeight: 'bold'}}>
                {rooms.length}
              </p>
            </div>
            <div style={statCardStyle}>
              <h3 style={{margin: 0, color: '#059669'}}>✅ Occupied</h3>
              <p style={{fontSize: '32px', margin: '10px 0', fontWeight: 'bold'}}>
                {rooms.filter(r => r.status === 'occupied').length}
              </p>
            </div>
            <div style={statCardStyle}>
              <h3 style={{margin: 0, color: '#059669'}}>🏠 Vacant</h3>
              <p style={{fontSize: '32px', margin: '10px 0', fontWeight: 'bold'}}>
                {rooms.filter(r => r.status === 'vacant').length}
              </p>
            </div>
          </div>
        )}

        {/* Building Selection */}
        {buildings.length > 0 && (
          <div style={cardStyle}>
            <h2>🏢 Select Building</h2>
            <div>
              {buildings.map(building => (
                <button
                  key={building.id}
                  onClick={() => setSelectedBuilding(building.id)}
                  style={{
                    ...buttonStyle,
                    backgroundColor: selectedBuilding === building.id ? '#059669' : '#6b7280'
                  }}
                >
                  {building.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Rooms Display */}
        {selectedBuilding && (
          <div style={cardStyle}>
            <h2>🏠 Rooms in {buildings.find(b => b.id === selectedBuilding)?.name}</h2>
            {currentRooms.length === 0 ? (
              <p>No rooms found in this building.</p>
            ) : (
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px'}}>
                {currentRooms.map(room => (
                  <div key={room.id} style={{
                    ...cardStyle,
                    backgroundColor: room.status === 'occupied' ? '#f0f9ff' : '#f9fafb'
                  }}>
                    <h3 style={{margin: '0 0 10px 0'}}>
                      {room.room_number} - {room.status === 'occupied' ? '👤 Occupied' : '🏠 Vacant'}
                    </h3>
                    {room.status === 'occupied' && (
                      <div>
                        <p><strong>Tenant:</strong> {room.tenant_name}</p>
                        <p><strong>Phone:</strong> {room.tenant_phone}</p>
                        <p><strong>Rent:</strong> ฿{room.rent_price?.toLocaleString()}</p>
                        <p><strong>Status:</strong> {room.is_overdue ? '⚠️ Overdue' : '✅ Current'}</p>
                      </div>
                    )}
                    {room.status === 'vacant' && (
                      <p style={{color: '#6b7280'}}>Available for rent</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={cardStyle}>
          <h2>🎯 Actions</h2>
          <button onClick={createSampleData} style={buttonStyle}>
            ➕ Add Sample Building & Rooms
          </button>
          <p style={{color: '#6b7280', marginTop: '10px'}}>
            Add more sample data to test all features of the application.
          </p>
        </div>

        {/* Data Display */}
        <div style={cardStyle}>
          <h2>🔍 Raw Data (for debugging)</h2>
          <details>
            <summary style={{cursor: 'pointer', padding: '10px', backgroundColor: '#f3f4f6'}}>
              Click to view raw buildings data
            </summary>
            <pre style={{backgroundColor: '#f9fafb', padding: '15px', overflow: 'auto'}}>
              {JSON.stringify(buildings, null, 2)}
            </pre>
          </details>
          <details style={{marginTop: '10px'}}>
            <summary style={{cursor: 'pointer', padding: '10px', backgroundColor: '#f3f4f6'}}>
              Click to view raw rooms data
            </summary>
            <pre style={{backgroundColor: '#f9fafb', padding: '15px', overflow: 'auto'}}>
              {JSON.stringify(currentRooms, null, 2)}
            </pre>
          </details>
        </div>

      </div>
    </div>
  );
};

export default WorkingApp;