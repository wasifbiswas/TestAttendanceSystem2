import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AttendanceOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'check-in' | 'check-out';
  onAutomaticSelect: () => void;
  onManualSelect: () => void;
}

const AttendanceOptionsModal: React.FC<AttendanceOptionsModalProps> = ({
  isOpen,
  onClose,
  type,
  onAutomaticSelect,
  onManualSelect,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {type === 'check-in' ? 'Check In Options' : 'Check Out Options'}
              </h2>
              <p className="text-gray-600 mb-6">
                Choose how you want to {type === 'check-in' ? 'check in' : 'check out'}:
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={onAutomaticSelect}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Automatic (Now)
                  <span className="ml-2 text-xs opacity-75">Current time</span>
                </button>
                
                <button
                  onClick={() => {
                    console.log('Manual option clicked');
                    onManualSelect();
                  }}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Manual (Choose Time)
                  <span className="ml-2 text-xs opacity-75">Pick date & time</span>
                </button>
              </div>
              
              <button
                onClick={onClose}
                className="mt-4 text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AttendanceOptionsModal;
