// =====================================================================================
//                          FRONTEND: components/DataManagement.jsx
// =====================================================================================
// Data export/import functionality for backup and restoration
// =====================================================================================

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import ErrorNotification from './ErrorNotification';

const DataManagement = ({ onDataUpdate }) => {
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const exportData = async () => {
    setIsExporting(true);
    try {
      // Fetch all data
      const { data: buildings, error: buildingsError } = await supabase
        .from('buildings')
        .select('*');
      if (buildingsError) throw buildingsError;

      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('*');
      if (roomsError) throw roomsError;

      // Create export object
      const exportData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        buildings,
        rooms
      };

      // Download as JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `porlivingspaces-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
    } catch (e) {
      console.error("Error exporting data:", e);
      setError("เกิดข้อผิดพลาดในการส่งออกข้อมูล");
    } finally {
      setIsExporting(false);
    }
  };

  const importData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const importData = JSON.parse(e.target.result);
          
          // Validate data structure
          if (!importData.buildings || !importData.rooms) {
            throw new Error("ไฟล์ข้อมูลไม่ถูกต้อง");
          }

          // Confirm import
          if (!window.confirm("การนำเข้าข้อมูลจะเขียนทับข้อมูลปัจจุบัน คุณต้องการดำเนินการต่อหรือไม่?")) {
            setIsImporting(false);
            return;
          }

          // Clear existing data (optional - you might want to keep this)
          // await supabase.from('rooms').delete().neq('id', '');
          // await supabase.from('buildings').delete().neq('id', '');

          // Import buildings
          if (importData.buildings.length > 0) {
            const { error: buildingsError } = await supabase
              .from('buildings')
              .upsert(importData.buildings);
            if (buildingsError) throw buildingsError;
          }

          // Import rooms
          if (importData.rooms.length > 0) {
            const { error: roomsError } = await supabase
              .from('rooms')
              .upsert(importData.rooms);
            if (roomsError) throw roomsError;
          }

          alert("นำเข้าข้อมูลสำเร็จ!");
          onDataUpdate();
          
        } catch (parseError) {
          console.error("Error parsing import file:", parseError);
          setError("ไฟล์ข้อมูลไม่ถูกต้องหรือเสียหาย");
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    } catch (e) {
      console.error("Error importing data:", e);
      setError("เกิดข้อผิดพลาดในการนำเข้าข้อมูล");
      setIsImporting(false);
    }
    
    // Reset file input
    event.target.value = '';
  };

  return (
    <>
      <ErrorNotification 
        error={error} 
        onClose={() => setError('')}
      />
      
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">จัดการข้อมูล</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Export Section */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">ส่งออกข้อมูล</h3>
            <p className="text-sm text-blue-700 mb-4">
              ส่งออกข้อมูลทั้งหมดเป็นไฟล์ JSON สำหรับสำรองข้อมูล
            </p>
            <button
              onClick={exportData}
              disabled={isExporting}
              className="w-full py-3 px-4 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 transition-colors duration-200"
            >
              {isExporting ? 'กำลังส่งออก...' : '📤 ส่งออกข้อมูล'}
            </button>
          </div>

          {/* Import Section */}
          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-2">นำเข้าข้อมูล</h3>
            <p className="text-sm text-green-700 mb-4">
              นำเข้าข้อมูลจากไฟล์สำรองข้อมูล (ระวัง: จะเขียนทับข้อมูลปัจจุบัน)
            </p>
            <input
              type="file"
              accept=".json"
              onChange={importData}
              disabled={isImporting}
              className="w-full py-3 px-4 rounded-lg border border-green-300 bg-white focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
            />
            {isImporting && (
              <p className="text-sm text-green-700 mt-2">กำลังนำเข้าข้อมูล...</p>
            )}
          </div>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">⚠️ คำเตือน</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• สำรองข้อมูลเป็นประจำเพื่อป้องกันการสูญหาย</li>
            <li>• การนำเข้าข้อมูลจะเขียนทับข้อมูลที่มีอยู่</li>
            <li>• ตรวจสอบไฟล์ให้ดีก่อนนำเข้า</li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default DataManagement;