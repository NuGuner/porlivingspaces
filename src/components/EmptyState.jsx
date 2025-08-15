// =====================================================================================
//                          FRONTEND: components/EmptyState.jsx
// =====================================================================================
// Empty state component for when no data is available
// =====================================================================================

import React from 'react';

const EmptyState = ({ type = 'general', onAction, actionText = 'เริ่มต้นใช้งาน' }) => {
  const emptyStates = {
    buildings: {
      icon: '🏢',
      title: 'ยังไม่มีอาคาร',
      description: 'เริ่มต้นสร้างอาคารแรกของคุณเพื่อจัดการห้องเช่า',
      actionText: 'เพิ่มอาคารใหม่'
    },
    rooms: {
      icon: '🏠',
      title: 'ยังไม่มีข้อมูลห้อง',
      description: 'เริ่มเพิ่มห้องเช่าในอาคารของคุณ',
      actionText: 'เพิ่มห้องใหม่'
    },
    tenants: {
      icon: '👥',
      title: 'ยังไม่มีผู้เช่า',
      description: 'เมื่อมีผู้เช่าเข้ามาอยู่ ข้อมูลจะแสดงที่นี่',
      actionText: 'จัดการห้องเช่า'
    },
    general: {
      icon: '📋',
      title: 'ยังไม่มีข้อมูล',
      description: 'เริ่มต้นใช้งานระบบเพื่อจัดการห้องเช่าของคุณ',
      actionText: actionText
    }
  };

  const state = emptyStates[type] || emptyStates.general;

  return (
    <div className="glass p-12 rounded-3xl text-center animate-fade-in">
      <div className="mb-6">
        <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl animate-float">
          {state.icon}
        </div>
        <h3 className="text-2xl font-bold gradient-text mb-3">{state.title}</h3>
        <p className="text-gray-600 text-lg max-w-md mx-auto">{state.description}</p>
      </div>
      
      {onAction && (
        <button
          onClick={onAction}
          className="btn-modern py-4 px-8 font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg hover:scale-105 transition-all duration-300 animate-glow"
        >
          <span className="flex items-center justify-center gap-2">
            <span className="text-lg">✨</span>
            {state.actionText}
          </span>
        </button>
      )}
      
      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          💡 เคล็ดลับ: ใช้เครื่องมือ "Data Debugger" ด้านบนเพื่อตรวจสอบการเชื่อมต่อฐานข้อมูล
        </p>
      </div>
    </div>
  );
};

export default EmptyState;