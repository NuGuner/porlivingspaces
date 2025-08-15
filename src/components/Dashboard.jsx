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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-600 mb-2">ห้องว่าง</h2>
        <p className="text-4xl font-bold text-teal-600">{stats.vacantRooms}</p>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-600 mb-2">ห้องมีผู้เช่า</h2>
        <p className="text-4xl font-bold text-blue-600">{stats.occupiedRooms}</p>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-600 mb-2">ห้องค้างค่าเช่า</h2>
        <p className="text-4xl font-bold text-red-600">{stats.overdueRooms}</p>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-600 mb-2">รายรับเดือนนี้</h2>
        <p className="text-4xl font-bold text-green-600">{stats.currentMonthIncome.toLocaleString('th-TH')} บาท</p>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-600 mb-2">ค่าเช่าค้างจ่าย</h2>
        <p className="text-4xl font-bold text-orange-600">{stats.outstandingRent.toLocaleString('th-TH')} บาท</p>
      </div>
    </div>
  );
};

export default Dashboard;
