// =====================================================================================
//                          FRONTEND: components/WelcomeGuide.jsx
// =====================================================================================
// Guide component for new users when no data is available
// =====================================================================================

import React from 'react';

const WelcomeGuide = ({ onCreateSampleData, onGoToBuildings }) => {
  return (
    <div className="card p-8 text-center max-w-3xl mx-auto">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-primary text-3xl">🏢</span>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        ยินดีต้อนรับสู่ PorLivingSpaces!
      </h2>
      
      <p className="text-gray-600 mb-8 leading-relaxed">
        ระบบจัดการห้องเช่าของคุณยังไม่มีข้อมูล เพื่อเริ่มใช้งาน คุณสามารถ:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card p-6 border-2 border-success/20 bg-success/5">
          <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-success text-xl">🎯</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">ใช้ข้อมูลตัวอย่าง</h3>
          <p className="text-sm text-gray-600 mb-4">
            สร้างข้อมูลตัวอย่างเพื่อทดลองใช้งานระบบ
          </p>
          <button
            onClick={onCreateSampleData}
            className="btn-primary py-2 px-4 text-sm w-full"
          >
            สร้างข้อมูลตัวอย่าง
          </button>
        </div>
        
        <div className="card p-6 border-2 border-primary/20 bg-primary/5">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-primary text-xl">🏗️</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">เริ่มต้นเอง</h3>
          <p className="text-sm text-gray-600 mb-4">
            เพิ่มอาคารและห้องเช่าของคุณเอง
          </p>
          <button
            onClick={onGoToBuildings}
            className="btn-secondary py-2 px-4 text-sm w-full"
          >
            เพิ่มอาคารใหม่
          </button>
        </div>
      </div>
      
      <div className="bg-info/5 border border-info/20 rounded-lg p-4">
        <h4 className="font-semibold text-info mb-2">💡 คำแนะนำ</h4>
        <p className="text-sm text-gray-600">
          ระบบนี้ใช้ Supabase เป็นฐานข้อมูล หากคุณเป็นผู้พัฒนา สามารถตรวจสอบสถานะการเชื่อมต่อได้จากส่วน "Database Connection Status" ด้านบน
        </p>
      </div>
    </div>
  );
};

export default WelcomeGuide;