import React from 'react';
import { motion } from 'framer-motion';
import { FaExclamationCircle, FaCheckCircle, FaTimes } from 'react-icons/fa';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, title, message, type }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="h-10 w-10 text-green-500" />;
      case 'error':
        return <FaExclamationCircle className="h-10 w-10 text-red-500" />;
      case 'warning':
        return <FaExclamationCircle className="h-10 w-10 text-yellow-500" />;
      case 'info':
      default:
        return <FaExclamationCircle className="h-10 w-10 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20';
      case 'info':
      default:
        return 'bg-blue-50 dark:bg-blue-900/20';
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`${getBgColor()} rounded-lg p-6 max-w-md w-full shadow-xl`}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              {getIcon()}
              <h3 className="text-lg font-medium ml-3">{title}</h3>
            </div>
            <button
              className="text-gray-400 hover:text-gray-500"
              onClick={onClose}
            >
              <FaTimes />
            </button>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default AlertModal;
