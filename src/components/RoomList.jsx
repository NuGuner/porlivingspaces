// =====================================================================================
//                          FRONTEND: components/RoomList.jsx
// =====================================================================================
// This component displays a list of rooms, provides functionality for managing tenants,
// generating bills, and handling payments.
// =====================================================================================

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { format, parseISO } from 'date-fns';
import ErrorNotification from './ErrorNotification';
import BillReceipt from './BillReceipt';

const RoomList = ({ rooms, waterRate, electricRate }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [error, setError] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // State for new room or edited room data
  const [roomData, setRoomData] = useState({
    room_number: '',
    building_id: '',
    tenant_name: '',
    tenant_address: '',
    tenant_phone: '',
    tenant_id_card: '',
    rent_price: 0,
    water_meter: 0,
    electric_meter: 0,
    status: 'vacant',
  });

  // Function to open the modal and set the mode
  const openModal = (mode, room = null) => {
    setModalMode(mode);
    if (room) {
      setCurrentRoom(room);
      setRoomData(room);
    } else {
      setRoomData({
        room_number: '',
        building_id: '',
        tenant_name: '',
        tenant_address: '',
        tenant_phone: '',
        tenant_id_card: '',
        rent_price: 0,
        water_meter: 0,
        electric_meter: 0,
        status: 'vacant',
      });
    }
    setShowModal(true);
  };

  // Function to handle saving a new or edited room
  const handleSaveRoom = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        const { error: addError } = await supabase
          .from('rooms')
          .insert({
            ...roomData,
            rent_price: Number(roomData.rent_price),
            water_meter: Number(roomData.water_meter),
            electric_meter: Number(roomData.electric_meter),
            is_overdue: false,
            current_bill: null,
            history: []
          });
        if (addError) throw addError;
      } else if (modalMode === 'edit' && currentRoom) {
        const { error: updateError } = await supabase
          .from('rooms')
          .update({
            ...roomData,
            rent_price: Number(roomData.rent_price),
            water_meter: Number(roomData.water_meter),
            electric_meter: Number(roomData.electric_meter),
          })
          .eq('id', currentRoom.id);
        if (updateError) throw updateError;
      }
      setShowModal(false);
    } catch (e) {
      console.error("Error saving room:", e);
      setError("เกิดข้อผิดพลาดในการบันทึกข้อมูลห้อง.");
    }
  };

  // Function to handle tenant checkout
  const handleCheckout = async (room) => {
    try {
      const { error: checkoutError } = await supabase
        .from('rooms')
        .update({
          tenant_name: null,
          tenant_address: null,
          tenant_phone: null,
          tenant_id_card: null,
          status: 'vacant',
          rent_price: 0,
          is_overdue: false,
          current_bill: null,
        })
        .eq('id', room.id);
      if (checkoutError) throw checkoutError;
    } catch (e) {
      console.error("Error checking out tenant:", e);
      setError("เกิดข้อผิดพลาดในการเช็คเอาท์.");
    }
  };

  // Function to handle bill calculation
  const handleCalculateBill = async (room) => {
    try {
      const now = new Date();
      const month = format(now, 'yyyy-MM');
      const dueDate = format(new Date(now.getFullYear(), now.getMonth(), 5), 'yyyy-MM-dd');
      const previousBill = room.history.length > 0 ? room.history[room.history.length - 1] : null;

      const waterUnitsUsed = room.water_meter - (previousBill ? previousBill.water_meter : 0);
      const electricUnitsUsed = room.electric_meter - (previousBill ? previousBill.electric_meter : 0);

      const waterCost = waterUnitsUsed * waterRate;
      const electricCost = electricUnitsUsed * electricRate;
      const totalAmount = room.rent_price + waterCost + electricCost;

      const newBill = {
        month,
        due_date: dueDate,
        tenant_name: room.tenant_name,
        rent_amount: room.rent_price,
        water_units: waterUnitsUsed,
        water_cost: waterCost,
        electric_units: electricUnitsUsed,
        electric_cost: electricCost,
        total_amount: totalAmount,
        is_paid: false
      };
      
      const { error: billError } = await supabase
        .from('rooms')
        .update({
          current_bill: newBill,
          is_overdue: false,
        })
        .eq('id', room.id);
      if (billError) throw billError;
      // Replaced alert with a more user-friendly modal or message box in a real app
      alert('สร้างบิลสำเร็จ! โปรดแจ้งผู้เช่า'); 
    } catch (e) {
      console.error("Error calculating bill:", e);
      setError("เกิดข้อผิดพลาดในการคำนวณบิล.");
    }
  };

  // Function to handle payment
  const handlePayment = async (room) => {
    try {
      const updatedHistory = [...room.history, {
        ...room.current_bill,
        water_meter: room.water_meter,
        electric_meter: room.electric_meter,
        is_paid: true
      }];
      
      const { error: paymentError } = await supabase
        .from('rooms')
        .update({
          current_bill: null,
          history: updatedHistory,
          is_overdue: false,
        })
        .eq('id', room.id);
      if (paymentError) throw paymentError;
    } catch (e) {
      console.error("Error processing payment:", e);
      setError("เกิดข้อผิดพลาดในการบันทึกการชำระเงิน.");
    }
  };

  // Function to show receipt
  const showBillReceipt = (room, bill) => {
    setReceiptData({ room, bill });
    setShowReceipt(true);
  };

  return (
    <>
      <ErrorNotification 
        error={error} 
        onClose={() => setError('')}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rooms.map(room => (
          <div key={room.id} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 transition-transform transform hover:scale-105 duration-200">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-2xl font-bold text-gray-900">{room.room_number}</h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  room.status === 'occupied' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                }`}
              >
                {room.status === 'occupied' ? 'มีผู้เช่า' : 'ห้องว่าง'}
              </span>
            </div>
            {room.status === 'occupied' ? (
              <>
                <p className="text-lg font-medium text-gray-700 mb-1">ผู้เช่า: {room.tenant_name}</p>
                <p className="text-sm text-gray-600 mb-1">ที่อยู่: {room.tenant_address}</p>
                <p className="text-sm text-gray-600 mb-1">เบอร์โทรศัพท์: {room.tenant_phone}</p>
                <p className="text-sm text-gray-600 mb-1">ค่าเช่า: {room.rent_price.toLocaleString('th-TH')} บาท</p>
                <p className="text-sm text-gray-600 mb-1">มิเตอร์น้ำ: {room.water_meter} หน่วย</p>
                <p className="text-sm text-gray-600 mb-4">มิเตอร์ไฟ: {room.electric_meter} หน่วย</p>
                {room.is_overdue && (
                  <p className="text-red-500 font-semibold mb-4">ค้างชำระค่าเช่า!</p>
                )}
                {room.current_bill && (
                  <div className="bg-yellow-50 p-4 rounded-xl mb-4">
                    <h4 className="font-bold text-lg text-yellow-800 mb-1">บิลเดือน {room.current_bill.month}</h4>
                    <p className="text-sm text-yellow-700">ชื่อผู้เช่า: {room.current_bill.tenant_name}</p>
                    <p className="text-sm text-yellow-700">รวม: {room.current_bill.total_amount.toLocaleString('th-TH')} บาท</p>
                    <p className="text-sm text-yellow-700">กำหนดชำระ: {format(parseISO(room.current_bill.due_date), 'd MMMM yyyy')}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => openModal('edit', room)}
                    className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => handleCalculateBill(room)}
                    className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-purple-500 text-white hover:bg-purple-600 transition-colors duration-200"
                  >
                    สร้างบิล
                  </button>
                  {room.current_bill && (
                    <>
                      <button
                        onClick={() => handlePayment(room)}
                        className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors duration-200"
                      >
                        ชำระแล้ว
                      </button>
                      <button
                        onClick={() => showBillReceipt(room, room.current_bill)}
                        className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-colors duration-200"
                      >
                        ใบเสร็จ
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleCheckout(room)}
                    className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors duration-200"
                  >
                    เช็คเอาท์
                  </button>
                </div>
              </>
            ) : (
              <div className="pt-8">
                <button
                  onClick={() => openModal('add', { ...roomData, room_number: room.room_number, building_id: room.building_id })}
                  className="w-full py-2 px-4 rounded-lg font-medium bg-teal-500 text-white hover:bg-teal-600 transition-colors duration-200"
                >
                  เพิ่มผู้เช่า
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal for adding/editing a room */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">
              {modalMode === 'add' ? 'เพิ่มห้องใหม่' : `แก้ไขห้อง ${currentRoom?.room_number}`}
            </h2>
            <form onSubmit={handleSaveRoom}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    อาคาร
                  </label>
                  <input
                    type="text"
                    disabled
                    value={roomData.building_id}
                    className="w-full p-3 rounded-lg border border-gray-300 bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    หมายเลขห้อง
                  </label>
                  <input
                    type="text"
                    value={roomData.room_number}
                    onChange={(e) => setRoomData({ ...roomData, room_number: e.target.value })}
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    ชื่อผู้เช่า
                  </label>
                  <input
                    type="text"
                    value={roomData.tenant_name}
                    onChange={(e) => setRoomData({ ...roomData, tenant_name: e.target.value })}
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    ที่อยู่
                  </label>
                  <input
                    type="text"
                    value={roomData.tenant_address}
                    onChange={(e) => setRoomData({ ...roomData, tenant_address: e.target.value })}
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    value={roomData.tenant_phone}
                    onChange={(e) => setRoomData({ ...roomData, tenant_phone: e.target.value })}
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    หมายเลขบัตรประชาชน
                  </label>
                  <input
                    type="text"
                    value={roomData.tenant_id_card}
                    onChange={(e) => setRoomData({ ...roomData, tenant_id_card: e.target.value })}
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    ค่าเช่า (บาท)
                  </label>
                  <input
                    type="number"
                    value={roomData.rent_price}
                    onChange={(e) => setRoomData({ ...roomData, rent_price: e.target.value })}
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    มิเตอร์น้ำ (หน่วย)
                  </label>
                  <input
                    type="number"
                    value={roomData.water_meter}
                    onChange={(e) => setRoomData({ ...roomData, water_meter: e.target.value })}
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    มิเตอร์ไฟ (หน่วย)
                  </label>
                  <input
                    type="number"
                    value={roomData.electric_meter}
                    onChange={(e) => setRoomData({ ...roomData, electric_meter: e.target.value })}
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-3 px-6 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors duration-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="py-3 px-6 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill Receipt Modal */}
      {showReceipt && receiptData && (
        <BillReceipt
          room={receiptData.room}
          bill={receiptData.bill}
          onClose={() => {
            setShowReceipt(false);
            setReceiptData(null);
          }}
        />
      )}
    </>
  );
};

export default RoomList;
