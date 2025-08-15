// =====================================================================================
//                          FRONTEND: components/Dashboard.jsx
// =====================================================================================
// This component displays key statistics and insights about the rental properties.
// It receives the list of rooms as a prop to calculate the stats.
// =====================================================================================

import React from 'react';
import { format } from 'date-fns';

const Dashboard = ({ rooms }) => {
  // Function to calculate dashboard stats
  const dashboardStats = () => {
    const occupiedRooms = rooms.filter(room => room.status === 'occupied').length;
    const vacantRooms = rooms.filter(room => room.status === 'vacant').length;
    
    // Calculate overdue rooms
    const overdueRooms = rooms.filter(room => room.is_overdue).length;
    
    // Calculate income for current and last month
    const now = new Date();
    const currentMonth = format(now, 'yyyy-MM');
    const lastMonth = format(new Date(now.getFullYear(), now.getMonth() - 1, 1), 'yyyy-MM');
    
    let currentMonthIncome = 0;
    let lastMonthIncome = 0;
    let outstandingRent = 0;

    rooms.forEach(room => {
      if (room.status === 'occupied' && room.current_bill && room.current_bill.month === currentMonth && room.current_bill.is_paid) {
        currentMonthIncome += room.current_bill.total_amount;
      }
      if (room.status === 'occupied' && room.current_bill && room.current_bill.month === lastMonth && room.current_bill.is_paid) {
        lastMonthIncome += room.current_bill.total_amount;
      }
      if (room.is_overdue) {
        outstandingRent += room.rent_price;
      }
    });

    return { occupiedRooms, vacantRooms, overdueRooms, currentMonthIncome, lastMonthIncome, outstandingRent };
  };

  const stats = dashboardStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12 animate-fade-in">
      <div className="glass p-8 rounded-3xl shadow-lg card-hover group">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-2xl flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform duration-300">
            🏠
          </div>
          <h2 className="text-lg font-medium text-gray-600">ห้องว่าง</h2>
        </div>
        <p className="text-4xl font-bold bg-gradient-to-r from-emerald-500 to-cyan-600 bg-clip-text text-transparent">
          {stats.vacantRooms}
        </p>
      </div>
      
      <div className="glass p-8 rounded-3xl shadow-lg card-hover group">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform duration-300">
            👥
          </div>
          <h2 className="text-lg font-medium text-gray-600">ห้องมีผู้เช่า</h2>
        </div>
        <p className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
          {stats.occupiedRooms}
        </p>
      </div>
      
      <div className="glass p-8 rounded-3xl shadow-lg card-hover group">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-red-400 to-pink-500 rounded-2xl flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform duration-300">
            ⚠️
          </div>
          <h2 className="text-lg font-medium text-gray-600">ห้องค้างค่าเช่า</h2>
        </div>
        <p className="text-4xl font-bold bg-gradient-to-r from-red-500 to-pink-600 bg-clip-text text-transparent">
          {stats.overdueRooms}
        </p>
      </div>
      
      <div className="glass p-8 rounded-3xl shadow-lg card-hover group">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform duration-300">
            💰
          </div>
          <h2 className="text-lg font-medium text-gray-600">รายรับเดือนนี้</h2>
        </div>
        <div className="flex flex-col">
          <p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
            {stats.currentMonthIncome.toLocaleString('th-TH')}
          </p>
          <span className="text-sm text-gray-500 font-medium">บาท</span>
        </div>
      </div>
      
      <div className="glass p-8 rounded-3xl shadow-lg card-hover group">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform duration-300">
            📋
          </div>
          <h2 className="text-lg font-medium text-gray-600">ค่าเช่าค้างจ่าย</h2>
        </div>
        <div className="flex flex-col">
          <p className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
            {stats.outstandingRent.toLocaleString('th-TH')}
          </p>
          <span className="text-sm text-gray-500 font-medium">บาท</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
