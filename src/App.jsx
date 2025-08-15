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
import DataDebugger from './components/DataDebugger';
import EmptyState from './components/EmptyState';

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
        if (buildingsError) {
          console.error("Buildings error:", buildingsError);
          setError(`ข้อผิดพลาดในการดึงข้อมูลอาคาร: ${buildingsError.message}`);
        } else {
          setBuildings(buildingsData || []);
          if (buildingsData && buildingsData.length > 0 && !selectedBuilding) {
            setSelectedBuilding(buildingsData[0].id);
          }
        }

        const { data: roomsData, error: roomsError } = await supabase
          .from('rooms')
          .select('*');
        if (roomsError) {
          console.error("Rooms error:", roomsError);
          setError(`ข้อผิดพลาดในการดึงข้อมูลห้อง: ${roomsError.message}`);
        } else {
          setRooms(roomsData || []);
        }

        setLoading(false);
      } catch (e) {
        console.error("General error fetching data:", e);
        setError(`เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล: ${e.message}`);
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="glass p-12 rounded-3xl shadow-xl animate-scale-in">
          <LoadingSpinner size="large" text="กำลังโหลดข้อมูล..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4 font-inter">
      <script src="https://cdn.tailwindcss.com"></script>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 gradient-text text-shadow">
            PorLivingSpaces
          </h1>
          <p className="text-xl text-gray-600 font-light">ระบบจัดการห้องเช่าสมัยใหม่</p>
          <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 mx-auto mt-4 rounded-full"></div>
        </div>
        
        <ErrorNotification 
          error={error} 
          onClose={() => setError('')}
        />

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`btn-modern py-3 px-6 md:px-8 font-medium transition-all duration-300 text-sm md:text-base ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                : 'glass text-gray-700 hover:bg-white/90 hover:shadow-md hover:scale-105'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <span className="hidden sm:inline">แดชบอร์ด</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('buildings')}
            className={`btn-modern py-3 px-6 md:px-8 font-medium transition-all duration-300 text-sm md:text-base ${
              activeTab === 'buildings'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                : 'glass text-gray-700 hover:bg-white/90 hover:shadow-md hover:scale-105'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">🏢</span>
              <span className="hidden sm:inline">จัดการอาคาร</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`btn-modern py-3 px-6 md:px-8 font-medium transition-all duration-300 text-sm md:text-base ${
              activeTab === 'data'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                : 'glass text-gray-700 hover:bg-white/90 hover:shadow-md hover:scale-105'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">💾</span>
              <span className="hidden sm:inline">จัดการข้อมูล</span>
            </span>
          </button>
        </div>

        {/* Debug Component - shows connection status and data */}
        <DataDebugger />

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* Dashboard component */}
            <Dashboard rooms={rooms} />

            {buildings.length === 0 ? (
              <EmptyState 
                type="buildings"
                onAction={() => setActiveTab('buildings')}
              />
            ) : (
              <>
                {/* Building tabs and add new room button */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 mb-8">
                  <div className="flex flex-wrap gap-3">
                    {buildings.map(building => (
                      <button
                        key={building.id}
                        onClick={() => setSelectedBuilding(building.id)}
                        className={`btn-modern py-3 px-5 font-medium transition-all duration-300 text-sm card-hover ${
                          selectedBuilding === building.id
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg transform scale-105'
                            : 'glass text-gray-700 hover:bg-white/90 hover:shadow-md'
                        }`}
                      >
                        {building.name}
                      </button>
                    ))}
                  </div>
                  <button
                    // onClick={() => openModal('add')}
                    className="btn-modern py-3 px-6 md:px-8 font-medium bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-sm md:text-base w-full sm:w-auto animate-glow"
                  >
                    <span className="flex items-center gap-2 justify-center">
                      <span className="text-lg">✨</span>
                      เพิ่มห้องใหม่
                    </span>
                  </button>
                </div>

                {/* Room List component */}
                {rooms.filter(room => room.building_id === selectedBuilding).length === 0 ? (
                  <EmptyState 
                    type="rooms"
                    actionText="เริ่มเพิ่มห้องเช่า"
                  />
                ) : (
                  <RoomList
                    rooms={rooms.filter(room => room.building_id === selectedBuilding)}
                    waterRate={WATER_RATE_PER_UNIT}
                    electricRate={ELECTRIC_RATE_PER_UNIT}
                  />
                )}
              </>
            )}
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

        {/* Modern Footer */}
        <footer className="mt-20 pb-8">
          <div className="glass p-8 rounded-3xl text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold">
                P
              </div>
              <h3 className="text-xl font-bold gradient-text">PorLivingSpaces</h3>
            </div>
            <p className="text-gray-600 mb-4">ระบบจัดการห้องเช่าสมัยใหม่ ใช้งานง่าย มีประสิทธิภาพ</p>
            <div className="flex justify-center gap-6 text-sm text-gray-500">
              <span>เวอร์ชัน 2.0</span>
              <span>•</span>
              <span>สร้างด้วย React + Vite</span>
              <span>•</span>
              <span>© 2024</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
