// =====================================================================================
//                          FRONTEND: components/DatabaseSetup.jsx
// =====================================================================================
// Component to check and setup database tables if needed
// =====================================================================================

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const DatabaseSetup = () => {
  const [setupStatus, setSetupStatus] = useState('idle');
  const [setupLog, setSetupLog] = useState([]);

  const addLog = (message, type = 'info') => {
    setSetupLog(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const setupDatabase = async () => {
    setSetupStatus('running');
    setSetupLog([]);
    
    try {
      addLog('🚀 Starting database setup...', 'info');
      
      // Check if buildings table exists and create if needed
      addLog('📋 Checking buildings table...', 'info');
      
      const { error: buildingsError } = await supabase
        .from('buildings')
        .select('count', { count: 'exact' });
      
      if (buildingsError && buildingsError.code === 'PGRST116') {
        addLog('❌ Buildings table does not exist', 'error');
        addLog('📝 Creating buildings table...', 'info');
        
        // Create buildings table
        const { error: createBuildingsError } = await supabase.rpc('create_buildings_table');
        
        if (createBuildingsError) {
          addLog(`❌ Failed to create buildings table: ${createBuildingsError.message}`, 'error');
        } else {
          addLog('✅ Buildings table created successfully', 'success');
        }
      } else if (buildingsError) {
        addLog(`❌ Buildings table error: ${buildingsError.message}`, 'error');
      } else {
        addLog('✅ Buildings table exists', 'success');
      }
      
      // Check if rooms table exists
      addLog('🏠 Checking rooms table...', 'info');
      
      const { error: roomsError } = await supabase
        .from('rooms')
        .select('count', { count: 'exact' });
      
      if (roomsError && roomsError.code === 'PGRST116') {
        addLog('❌ Rooms table does not exist', 'error');
        addLog('📝 Creating rooms table...', 'info');
        
        // Create rooms table
        const { error: createRoomsError } = await supabase.rpc('create_rooms_table');
        
        if (createRoomsError) {
          addLog(`❌ Failed to create rooms table: ${createRoomsError.message}`, 'error');
        } else {
          addLog('✅ Rooms table created successfully', 'success');
        }
      } else if (roomsError) {
        addLog(`❌ Rooms table error: ${roomsError.message}`, 'error');
      } else {
        addLog('✅ Rooms table exists', 'success');
      }
      
      addLog('🎉 Database setup completed!', 'success');
      setSetupStatus('completed');
      
    } catch (error) {
      addLog(`💥 Setup failed: ${error.message}`, 'error');
      setSetupStatus('failed');
    }
  };

  const createSampleData = async () => {
    setSetupStatus('creating-data');
    addLog('🎯 Creating sample data...', 'info');
    
    try {
      // Create sample building
      const { data: building, error: buildingError } = await supabase
        .from('buildings')
        .insert([{ name: 'อาคาร A' }])
        .select();

      if (buildingError) {
        addLog(`❌ Failed to create building: ${buildingError.message}`, 'error');
        return;
      }
      
      addLog('✅ Sample building created', 'success');

      // Create sample rooms
      const buildingId = building[0].id;
      const { error: roomsError } = await supabase
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
            current_bill: {
              month: '2024-01',
              due_date: '2024-01-05',
              tenant_name: 'สมชาย ใจดี',
              rent_amount: 8000,
              water_units: 25,
              water_cost: 375,
              electric_units: 45,
              electric_cost: 360,
              total_amount: 8735,
              is_paid: false
            },
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
        ]);

      if (roomsError) {
        addLog(`❌ Failed to create rooms: ${roomsError.message}`, 'error');
        return;
      }
      
      addLog('✅ Sample rooms created', 'success');
      addLog('🎉 Sample data creation completed! Please refresh the page.', 'success');
      setSetupStatus('data-created');
      
    } catch (error) {
      addLog(`💥 Data creation failed: ${error.message}`, 'error');
      setSetupStatus('failed');
    }
  };

  return (
    <div className="card p-6 mb-6 border-2 border-warning/20 bg-warning/5">
      <h3 className="text-lg font-semibold text-warning mb-4">🛠️ Database Setup & Troubleshooting</h3>
      
      <div className="space-y-4">
        <div className="flex gap-3">
          <button
            onClick={setupDatabase}
            disabled={setupStatus === 'running'}
            className="btn-primary py-2 px-4 text-sm disabled:opacity-50"
          >
            {setupStatus === 'running' ? '⏳ Setting up...' : '🔧 Check & Setup Database'}
          </button>
          
          <button
            onClick={createSampleData}
            disabled={setupStatus === 'creating-data'}
            className="btn-secondary py-2 px-4 text-sm disabled:opacity-50"
          >
            {setupStatus === 'creating-data' ? '⏳ Creating...' : '🎯 Create Sample Data'}
          </button>
        </div>
        
        {setupLog.length > 0 && (
          <div className="bg-white border rounded p-4 max-h-64 overflow-y-auto">
            <h4 className="font-semibold text-gray-700 mb-2">Setup Log:</h4>
            <div className="space-y-1 font-mono text-sm">
              {setupLog.map((log, index) => (
                <div key={index} className={`${
                  log.type === 'error' ? 'text-error' :
                  log.type === 'success' ? 'text-success' :
                  'text-gray-600'
                }`}>
                  <span className="text-gray-400">[{log.timestamp}]</span> {log.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseSetup;