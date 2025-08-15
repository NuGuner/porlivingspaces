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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      <div className="card p-6 card-hover">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
            <span className="text-success text-lg">🏠</span>
          </div>
          <span className="text-2xl font-bold text-success">{stats.vacantRooms}</span>
        </div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">ห้องว่าง</h3>
        <p className="text-xs text-gray-500">พร้อมให้เช่า</p>
      </div>
      
      <div className="card p-6 card-hover">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <span className="text-primary text-lg">👥</span>
          </div>
          <span className="text-2xl font-bold text-primary">{stats.occupiedRooms}</span>
        </div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">ห้องมีผู้เช่า</h3>
        <p className="text-xs text-gray-500">กำลังดำเนินการ</p>
      </div>
      
      <div className="card p-6 card-hover">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-error/10 rounded-lg flex items-center justify-center">
            <span className="text-error text-lg">⚠️</span>
          </div>
          <span className="text-2xl font-bold text-error">{stats.overdueRooms}</span>
        </div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">ห้องค้างค่าเช่า</h3>
        <p className="text-xs text-gray-500">ต้องติดตาม</p>
      </div>
      
      <div className="card p-6 card-hover">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
            <span className="text-success text-lg">💰</span>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-success">
              {stats.currentMonthIncome.toLocaleString('th-TH')}
            </div>
            <div className="text-xs text-gray-500">บาท</div>
          </div>
        </div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">รายรับเดือนนี้</h3>
        <p className="text-xs text-gray-500">ยอดเก็บได้</p>
      </div>
      
      <div className="card p-6 card-hover">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
            <span className="text-warning text-lg">📋</span>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-warning">
              {stats.outstandingRent.toLocaleString('th-TH')}
            </div>
            <div className="text-xs text-gray-500">บาท</div>
          </div>
        </div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">ค่าเช่าค้างจ่าย</h3>
        <p className="text-xs text-gray-500">รอการชำระ</p>
      </div>
    </div>
  );
};

export default Dashboard;
