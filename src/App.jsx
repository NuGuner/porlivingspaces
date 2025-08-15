// =====================================================================================
//                          FRONTEND: App.jsx
// =====================================================================================
// This is the main application component. It manages the state for buildings and rooms,
// handles data fetching, and renders the dashboard and room list.
// =====================================================================================

import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Dashboard from './components/Dashboard';
import RoomList from './components/RoomList';
import ErrorNotification from './components/ErrorNotification';
import BuildingManagement from './components/BuildingManagement';
import DataManagement from './components/DataManagement';
import LoadingSpinner from './components/LoadingSpinner';

// Constants for bill calculation
const WATER_RATE_PER_UNIT = 15;
const ELECTRIC_RATE_PER_UNIT = 8;

const App = () => {
  // State Hooks for data and application state
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  // useEffect to fetch initial data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: buildingsData, error: buildingsError } = await supabase
          .from('buildings')
          .select('*');
        if (buildingsError) throw buildingsError;
        setBuildings(buildingsData);
        if (buildingsData.length > 0 && !selectedBuilding) {
          setSelectedBuilding(buildingsData[0].id);
        }

        const { data: roomsData, error: roomsError } = await supabase
          .from('rooms')
          .select('*');
        if (roomsError) throw roomsError;
        setRooms(roomsData);

        setLoading(false);
      } catch (e) {
        console.error("Error fetching data:", e);
        setError("เกิดข้อผิดพลาดในการดึงข้อมูล. กรุณาลองใหม่อีกครั้ง.");
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedBuilding]);

  // Function to refresh data
  const refreshData = async () => {
    try {
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select('*');
      if (buildingsError) throw buildingsError;
      setBuildings(buildingsData);

      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*');
      if (roomsError) throw roomsError;
      setRooms(roomsData);
    } catch (e) {
      console.error("Error refreshing data:", e);
      setError("เกิดข้อผิดพลาดในการรีเฟรชข้อมูล");
    }
  };

  // UI
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <LoadingSpinner size="large" text="กำลังโหลดข้อมูล..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-inter text-gray-800">
      <script src="https://cdn.tailwindcss.com"></script>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center mb-6 text-gray-900">ระบบจัดการห้องเช่า</h1>
        
        <ErrorNotification 
          error={error} 
          onClose={() => setError('')}
        />

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-3 md:px-4 rounded-lg font-semibold transition-colors duration-200 text-sm md:text-base ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-blue-100 border border-gray-300'
            }`}
          >
            <span className="hidden sm:inline">📊 แดชบอร์ด</span>
            <span className="sm:hidden">📊</span>
          </button>
          <button
            onClick={() => setActiveTab('buildings')}
            className={`py-2 px-3 md:px-4 rounded-lg font-semibold transition-colors duration-200 text-sm md:text-base ${
              activeTab === 'buildings'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-blue-100 border border-gray-300'
            }`}
          >
            <span className="hidden sm:inline">🏢 จัดการอาคาร</span>
            <span className="sm:hidden">🏢</span>
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`py-2 px-3 md:px-4 rounded-lg font-semibold transition-colors duration-200 text-sm md:text-base ${
              activeTab === 'data'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-blue-100 border border-gray-300'
            }`}
          >
            <span className="hidden sm:inline">💾 จัดการข้อมูล</span>
            <span className="sm:hidden">💾</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* Dashboard component */}
            <Dashboard rooms={rooms} />

            {/* Building tabs and add new room button */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
              <div className="flex flex-wrap gap-2">
                {buildings.map(building => (
                  <button
                    key={building.id}
                    onClick={() => setSelectedBuilding(building.id)}
                    className={`py-2 px-3 md:px-4 rounded-lg font-semibold transition-colors duration-200 text-sm md:text-base ${
                      selectedBuilding === building.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-blue-100 border border-gray-300'
                    }`}
                  >
                    {building.name}
                  </button>
                ))}
              </div>
              <button
                // onClick={() => openModal('add')}
                className="py-2 px-4 md:px-6 rounded-lg font-semibold bg-green-600 text-white shadow-md hover:bg-green-700 transition-colors duration-200 text-sm md:text-base w-full sm:w-auto"
              >
                + เพิ่มห้องใหม่
              </button>
            </div>

            {/* Room List component */}
            <RoomList
              rooms={rooms.filter(room => room.building_id === selectedBuilding)}
              waterRate={WATER_RATE_PER_UNIT}
              electricRate={ELECTRIC_RATE_PER_UNIT}
            />
          </>
        )}

        {activeTab === 'buildings' && (
          <BuildingManagement 
            buildings={buildings} 
            onBuildingUpdate={refreshData}
          />
        )}

        {activeTab === 'data' && (
          <DataManagement 
            onDataUpdate={refreshData}
          />
        )}
      </div>
    </div>
  );
};

export default App;
