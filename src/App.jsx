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
import WelcomeGuide from './components/WelcomeGuide';
import ConnectionTest from './components/ConnectionTest';
import DatabaseSetup from './components/DatabaseSetup';

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

  // Function to create sample data
  const createSampleData = async () => {
    try {
      setLoading(true);
      // Create sample building
      const { data: building, error: buildingError } = await supabase
        .from('buildings')
        .insert([{ name: 'อาคาร A' }])
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
            rent_price: 7500,
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

      // Refresh data after creating sample data
      await refreshData();
      setLoading(false);
      setError(''); // Clear any previous errors
      
    } catch (error) {
      setError(`เกิดข้อผิดพลาดในการสร้างข้อมูลตัวอย่าง: ${error.message}`);
      setLoading(false);
    }
  };

  // UI
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary">
        <div className="card p-12">
          <LoadingSpinner size="large" text="กำลังโหลดข้อมูล..." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-secondary font-inter">
      <script src="https://cdn.tailwindcss.com"></script>
      
      {/* Sidebar Navigation */}
      <div className="sidebar w-64 p-6 flex-shrink-0">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
              P
            </div>
            <h1 className="text-xl font-bold text-gray-900">PorLivingSpaces</h1>
          </div>
          <p className="text-sm text-gray-600">ระบบจัดการห้องเช่า</p>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'dashboard'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-700 hover:bg-tertiary'
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="text-lg">📊</span>
              แดชบอร์ด
            </span>
          </button>
          <button
            onClick={() => setActiveTab('buildings')}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'buildings'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-700 hover:bg-tertiary'
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="text-lg">🏢</span>
              จัดการอาคาร
            </span>
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'data'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-700 hover:bg-tertiary'
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="text-lg">💾</span>
              จัดการข้อมูล
            </span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content flex-1 p-8">
        <div className="max-w-6xl mx-auto">
        
          <ErrorNotification 
            error={error} 
            onClose={() => setError('')}
          />

          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {activeTab === 'dashboard' && 'แดชบอร์ด'}
              {activeTab === 'buildings' && 'จัดการอาคาร'}
              {activeTab === 'data' && 'จัดการข้อมูล'}
            </h2>
            <p className="text-gray-600">
              {activeTab === 'dashboard' && 'ภาพรวมและสถิติการดำเนินงาน'}
              {activeTab === 'buildings' && 'เพิ่ม แก้ไข และจัดการอาคารของคุณ'}
              {activeTab === 'data' && 'นำเข้า ส่งออก และสำรองข้อมูล'}
            </p>
          </div>

          {/* Connection Test - diagnose the actual issue */}
          <ConnectionTest />
          
          {/* Database Setup - check and create tables if needed */}
          <DatabaseSetup />
          
          {/* Debug Component - shows connection status and data */}
          <DataDebugger />

          {/* Tab Content */}
          {activeTab === 'dashboard' && (
            <>
              {/* Dashboard component */}
              <Dashboard rooms={rooms} />

              {buildings.length === 0 ? (
                <WelcomeGuide 
                  onCreateSampleData={createSampleData}
                  onGoToBuildings={() => setActiveTab('buildings')}
                />
              ) : (
                <>
                  {/* Building Selection */}
                  <div className="card p-6 mb-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">เลือกอาคาร</h3>
                        <p className="text-sm text-gray-600">เลือกอาคารเพื่อดูข้อมูลห้องเช่า</p>
                      </div>
                      <div className="flex gap-2">
                        {buildings.map(building => (
                          <button
                            key={building.id}
                            onClick={() => setSelectedBuilding(building.id)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                              selectedBuilding === building.id
                                ? 'btn-primary'
                                : 'btn-secondary'
                            }`}
                          >
                            {building.name}
                          </button>
                        ))}
                        <button className="btn-primary px-4 py-2">
                          + เพิ่มห้องใหม่
                        </button>
                      </div>
                    </div>
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

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-gray-200">
            <div className="text-center text-sm text-gray-500">
              <p>© 2024 PorLivingSpaces - ระบบจัดการห้องเช่า | เวอร์ชัน 2.0</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default App;
