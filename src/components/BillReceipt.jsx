// =====================================================================================
//                          FRONTEND: components/BillReceipt.jsx
// =====================================================================================
// Printable bill receipt component with professional formatting
// =====================================================================================

import React from 'react';
import { format, parseISO } from 'date-fns';

const BillReceipt = ({ room, bill, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  if (!bill) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        
        {/* Print-friendly receipt */}
        <div className="p-8 print:p-0 print:shadow-none">
          {/* Header */}
          <div className="text-center mb-6 print:mb-4">
            <h1 className="text-2xl font-bold text-gray-900 print:text-xl">ใบเสร็จรับเงิน</h1>
            <p className="text-sm text-gray-600">ระบบจัดการห้องเช่า PorLivingSpaces</p>
            <hr className="my-4 border-gray-300" />
          </div>

          {/* Bill Details */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="font-medium">เลขที่ห้อง:</span>
              <span>{room.room_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">ชื่อผู้เช่า:</span>
              <span>{bill.tenant_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">เดือน:</span>
              <span>{bill.month}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">วันที่ครบกำหนด:</span>
              <span>{format(parseISO(bill.due_date), 'dd/MM/yyyy')}</span>
            </div>
          </div>

          <hr className="my-4 border-gray-300" />

          {/* Charges Breakdown */}
          <div className="space-y-3 mb-6">
            <h3 className="font-semibold text-lg">รายการค่าใช้จ่าย</h3>
            
            <div className="flex justify-between">
              <span>ค่าเช่าห้อง</span>
              <span>{bill.rent_amount.toLocaleString('th-TH')} บาท</span>
            </div>
            
            <div className="flex justify-between">
              <span>ค่าน้ำ ({bill.water_units} หน่วย)</span>
              <span>{bill.water_cost.toLocaleString('th-TH')} บาท</span>
            </div>
            
            <div className="flex justify-between">
              <span>ค่าไฟ ({bill.electric_units} หน่วย)</span>
              <span>{bill.electric_cost.toLocaleString('th-TH')} บาท</span>
            </div>
          </div>

          <hr className="my-4 border-gray-300" />

          {/* Total */}
          <div className="flex justify-between text-xl font-bold mb-6">
            <span>รวมทั้งสิ้น</span>
            <span>{bill.total_amount.toLocaleString('th-TH')} บาท</span>
          </div>

          {/* Payment Status */}
          <div className="text-center mb-6">
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
              bill.is_paid 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {bill.is_paid ? '✅ ชำระแล้ว' : '⏳ รอการชำระ'}
            </span>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600 mt-8 pt-4 border-t border-gray-300">
            <p>ออกใบเสร็จเมื่อ: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
            <p className="mt-2">ขอบคุณที่ใช้บริการ</p>
          </div>
        </div>

        {/* Action Buttons - Hidden when printing */}
        <div className="flex justify-end space-x-3 p-6 bg-gray-50 rounded-b-2xl print:hidden">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors duration-200"
          >
            ปิด
          </button>
          <button
            onClick={handlePrint}
            className="py-2 px-4 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
          >
            🖨️ พิมพ์ใบเสร็จ
          </button>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:text-xl {
            font-size: 1.25rem !important;
          }
          .print\\:mb-4 {
            margin-bottom: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BillReceipt;