// =====================================================================================
//                          FRONTEND: components/BuildingManagement.jsx
// =====================================================================================
// Building management component for adding, editing, and deleting buildings
// =====================================================================================

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import ErrorNotification from './ErrorNotification';

const BuildingManagement = ({ buildings, onBuildingUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentBuilding, setCurrentBuilding] = useState(null);
  const [error, setError] = useState('');
  const [buildingData, setBuildingData] = useState({
    name: '',
  });

  const openModal = (mode, building = null) => {
    setModalMode(mode);
    if (building) {
      setCurrentBuilding(building);
      setBuildingData({ name: building.name });
    } else {
      setBuildingData({ name: '' });
    }
    setShowModal(true);
  };

  const handleSaveBuilding = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        const { error: addError } = await supabase
          .from('buildings')
          .insert({ name: buildingData.name });
        if (addError) throw addError;
      } else if (modalMode === 'edit' && currentBuilding) {
        const { error: updateError } = await supabase
          .from('buildings')
          .update({ name: buildingData.name })
          .eq('id', currentBuilding.id);
        if (updateError) throw updateError;
      }
      setShowModal(false);
      onBuildingUpdate();
    } catch (e) {
      console.error("Error saving building:", e);
      setError("เกิดข้อผิดพลาดในการบันทึกข้อมูลอาคาร");
    }
  };

  const handleDeleteBuilding = async (building) => {
    if (window.confirm(`คุณต้องการลบอาคาร "${building.name}" หรือไม่?`)) {
      try {
        const { error: deleteError } = await supabase
          .from('buildings')
          .delete()
          .eq('id', building.id);
        if (deleteError) throw deleteError;
        onBuildingUpdate();
      } catch (e) {
        console.error("Error deleting building:", e);
        setError("เกิดข้อผิดพลาดในการลบอาคาร");
      }
    }
  };

  return (
    <>
      <ErrorNotification 
        error={error} 
        onClose={() => setError('')}
      />
      
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">จัดการอาคาร</h2>
          <button
            onClick={() => openModal('add')}
            className="py-2 px-4 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
          >
            + เพิ่มอาคารใหม่
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buildings.map(building => (
            <div key={building.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{building.name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => openModal('edit', building)}
                  className="flex-1 py-2 px-3 rounded-lg text-sm font-medium bg-yellow-500 text-white hover:bg-yellow-600 transition-colors duration-200"
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => handleDeleteBuilding(building)}
                  className="flex-1 py-2 px-3 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors duration-200"
                >
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for adding/editing building */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              {modalMode === 'add' ? 'เพิ่มอาคารใหม่' : `แก้ไขอาคาร`}
            </h2>
            <form onSubmit={handleSaveBuilding}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  ชื่ออาคาร
                </label>
                <input
                  type="text"
                  value={buildingData.name}
                  onChange={(e) => setBuildingData({ name: e.target.value })}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="กรอกชื่ออาคาร"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-2 px-4 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors duration-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default BuildingManagement;