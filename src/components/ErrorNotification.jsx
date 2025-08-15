// =====================================================================================
//                          FRONTEND: components/ErrorNotification.jsx
// =====================================================================================
// Reusable error notification component with auto-dismiss functionality
// =====================================================================================

import React, { useEffect } from 'react';

const ErrorNotification = ({ error, onClose, autoClose = true, duration = 5000 }) => {
  useEffect(() => {
    if (autoClose && error && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [error, onClose, autoClose, duration]);

  if (!error) return null;

  return (
    <div className="fixed top-6 right-6 max-w-md glass border-l-4 border-red-400 p-6 rounded-2xl shadow-xl z-50 animate-slide-in backdrop-blur-xl">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">เกิดข้อผิดพลาด</h3>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={onClose}
            className="inline-flex glass rounded-xl p-2 text-red-400 hover:bg-red-100/50 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 transition-all duration-200"
          >
            <span className="sr-only">ปิด</span>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorNotification;