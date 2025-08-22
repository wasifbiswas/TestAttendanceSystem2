import React, { useState, useEffect } from 'react';
import { XMarkIcon, ExclamationTriangleIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { Department } from '../../api/departmentApi';

interface DeleteDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  department: Department;
}

const DeleteDepartmentModal: React.FC<DeleteDepartmentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  department
}) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'warning' | '2fa'>('warning');
  const [countdown, setCountdown] = useState(3);
  const [canProceed, setCanProceed] = useState(false);

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setStep('warning');
      setCountdown(3);
      setCanProceed(false);
      setLoading(false);
    }
  }, [isOpen]);

  // Countdown timer for 2FA step
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (step === '2fa' && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (step === '2fa' && countdown === 0) {
      setCanProceed(true);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  const handleFirstStep = () => {
    if (department.employee_count > 0) {
      return; // Cannot proceed if department has employees
    }
    setStep('2fa');
    setCountdown(3);
  };

  const handleConfirm = async () => {
    if (!canProceed || loading) return;
    
    setLoading(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Error deleting department:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const hasEmployees = department.employee_count > 0;

  // Debug logging
  console.log('DEBUG: DeleteDepartmentModal rendering with:', {
    isOpen,
    department: department.dept_name,
    hasEmployees,
    step,
    countdown,
    canProceed
  });

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        {/* Background overlay with blur effect */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        ></div>

        {/* Modal Container */}
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transform transition-all duration-300 w-full max-w-md mx-4 overflow-hidden">
          
          {/* Step 1: Warning */}
          {step === 'warning' && (
            <div className="relative">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      Delete Department
                    </h3>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    You are about to permanently delete this department
                  </p>

                  {/* Department Card */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-center mb-3">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🏢</span>
                      </div>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {department.dept_name}
                    </h4>
                    <div className="flex items-center justify-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <span className={`w-2 h-2 rounded-full ${
                          department.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'
                        }`}></span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {department.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-600 dark:text-gray-400">👥</span>
                        <span className={`font-medium ${hasEmployees ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'}`}>
                          {department.employee_count} employees
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warning Messages */}
                {hasEmployees ? (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                          <span className="text-red-600 dark:text-red-400 text-sm">🚫</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                          Cannot Delete Department
                        </h4>
                        <p className="text-sm text-red-700 dark:text-red-400">
                          This department has <strong>{department.employee_count} active employee{department.employee_count > 1 ? 's' : ''}</strong>. 
                          Please reassign all employees before deletion.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                          <span className="text-amber-600 dark:text-amber-400 text-sm">⚠️</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                          Permanent Action
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          This action cannot be undone. All department data will be permanently removed.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  {!hasEmployees && (
                    <button
                      type="button"
                      onClick={handleFirstStep}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <span>Continue</span>
                      <span>→</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 2FA Confirmation */}
          {step === '2fa' && (
            <div className="relative">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white text-xl">🔐</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Final Confirmation
                  </h3>
                  <p className="text-red-100 text-sm mt-1">
                    Security verification required
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    You are about to permanently delete:
                  </p>
                  
                  <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-2xl">🏢</span>
                      <h4 className="text-lg font-bold text-red-800 dark:text-red-300">
                        {department.dept_name}
                      </h4>
                    </div>
                  </div>

                  {/* Countdown Timer */}
                  {countdown > 0 ? (
                    <div className="text-center">
                      <div className="relative w-20 h-20 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-red-500 border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {countdown}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Security delay: {countdown} second{countdown > 1 ? 's' : ''} remaining
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        This prevents accidental deletions
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-green-600 dark:text-green-400 text-2xl">✓</span>
                      </div>
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-2">
                        Verification Complete
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        You may now confirm the deletion
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={!canProceed || loading}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                      canProceed && !loading
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <span>{canProceed ? 'Delete Forever' : `Wait ${countdown}s`}</span>
                        {canProceed && <span>🗑️</span>}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteDepartmentModal;
