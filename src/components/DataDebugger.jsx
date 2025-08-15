// =====================================================================================
//                          FRONTEND: components/DataDebugger.jsx
// =====================================================================================
// Debug component to check Supabase connection and data
// =====================================================================================

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const DataDebugger = () => {
  const [debugInfo, setDebugInfo] = useState({
    buildings: [],
    rooms: [],
    errors: [],
    connectionStatus: 'checking...'
  });

  useEffect(() => {
    const debugConnection = async () => {
      const errors = [];
      let buildings = [];
      let rooms = [];
      
      try {
        // Test connection
        const { data: testData, error: testError } = await supabase
          .from('buildings')
          .select('count', { count: 'exact' });
        
        if (testError) {
          errors.push(`Connection error: ${testError.message}`);
          setDebugInfo(prev => ({ ...prev, connectionStatus: 'failed', errors }));
          return;
        }
        
        setDebugInfo(prev => ({ ...prev, connectionStatus: 'connected' }));

        // Fetch buildings
        const { data: buildingsData, error: buildingsError } = await supabase
          .from('buildings')
          .select('*');
          
        if (buildingsError) {
          errors.push(`Buildings error: ${buildingsError.message}`);
        } else {
          buildings = buildingsData || [];
        }

        // Fetch rooms
        const { data: roomsData, error: roomsError } = await supabase
          .from('rooms')
          .select('*');
          
        if (roomsError) {
          errors.push(`Rooms error: ${roomsError.message}`);
        } else {
          rooms = roomsData || [];
        }

        setDebugInfo({
          buildings,
          rooms,
          errors,
          connectionStatus: 'connected'
        });

      } catch (error) {
        errors.push(`General error: ${error.message}`);
        setDebugInfo(prev => ({ 
          ...prev, 
          connectionStatus: 'failed', 
          errors 
        }));
      }
    };

    debugConnection();
  }, []);

  const createSampleData = async () => {
    try {
      // Create sample building
      const { data: building, error: buildingError } = await supabase
        .from('buildings')
        .insert([
          { name: 'อาคาร A' }
        ])
        .select();

      if (buildingError) throw buildingError;

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
            rent_price: 0,
            water_meter: 0,
            electric_meter: 0,
            status: 'vacant',
            is_overdue: false,
            current_bill: null,
            history: []
          },
          {
            room_number: 'A103',
            building_id: buildingId,
            tenant_name: 'สมหญิง รักดี',
            tenant_address: '456 ถนนราชดำริ กรุงเทพฯ',
            tenant_phone: '082-345-6789',
            tenant_id_card: '9876543210987',
            rent_price: 7500,
            water_meter: 180,
            electric_meter: 195,
            status: 'occupied',
            is_overdue: true,
            current_bill: null,
            history: []
          }
        ]);

      if (roomsError) throw roomsError;

      alert('Sample data created successfully! Please refresh the page.');
      
    } catch (error) {
      alert(`Error creating sample data: ${error.message}`);
    }
  };

  return (
    <div className="glass p-6 rounded-3xl mb-6">
      <h2 className="text-xl font-bold gradient-text mb-4">🔍 Data Debugger</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">Connection Status</h3>
          <p className={`font-bold ${
            debugInfo.connectionStatus === 'connected' ? 'text-green-600' : 
            debugInfo.connectionStatus === 'failed' ? 'text-red-600' : 'text-yellow-600'
          }`}>
            {debugInfo.connectionStatus}
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-200">
          <h3 className="font-semibold text-green-800 mb-2">Buildings Found</h3>
          <p className="text-2xl font-bold text-green-600">{debugInfo.buildings.length}</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-2xl border border-purple-200">
          <h3 className="font-semibold text-purple-800 mb-2">Rooms Found</h3>
          <p className="text-2xl font-bold text-purple-600">{debugInfo.rooms.length}</p>
        </div>
      </div>

      {debugInfo.errors.length > 0 && (
        <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 p-4 rounded-2xl mb-4">
          <h3 className="font-semibold text-red-800 mb-2">Errors:</h3>
          {debugInfo.errors.map((error, index) => (
            <p key={index} className="text-red-600 text-sm">{error}</p>
          ))}
        </div>
      )}

      {debugInfo.buildings.length === 0 && debugInfo.connectionStatus === 'connected' && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 p-4 rounded-2xl mb-4">
          <h3 className="font-semibold text-yellow-800 mb-2">No Data Found</h3>
          <p className="text-yellow-700 text-sm mb-3">
            Your Supabase tables appear to be empty. Would you like to create some sample data?
          </p>
          <button
            onClick={createSampleData}
            className="btn-modern py-2 px-4 font-medium bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            Create Sample Data
          </button>
        </div>
      )}

      {debugInfo.buildings.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Buildings Data:</h3>
            <pre className="bg-gray-100 p-3 rounded-xl text-xs overflow-x-auto">
              {JSON.stringify(debugInfo.buildings, null, 2)}
            </pre>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Rooms Data:</h3>
            <pre className="bg-gray-100 p-3 rounded-xl text-xs overflow-x-auto">
              {JSON.stringify(debugInfo.rooms, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataDebugger;