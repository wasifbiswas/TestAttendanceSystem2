import React, { useState } from 'react';
import { 
  PencilIcon, 
  TrashIcon, 
  UserIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { showNotification } from '../utils/notifications';

// Debug version of Department Management with enhanced logging
const DebugDepartmentManagement: React.FC = () => {
  const [clickLog, setClickLog] = useState<string[]>([]);

  const addToLog = (message: string) => {
    console.log(`DEBUG: ${message}`);
    setClickLog(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 9)]);
    showNotification(message, 'success');
  };

  const mockDepartments = [
    {
      _id: '1',
      dept_name: 'Human Resources',
      department_head: { username: 'John Doe', employee_id: 'EMP001' },
      employeeCount: 15,
      budget: 50000,
      location: 'Building A, Floor 2'
    },
    {
      _id: '2', 
      dept_name: 'Information Technology',
      department_head: { username: 'Jane Smith', employee_id: 'EMP002' },
      employeeCount: 25,
      budget: 150000,
      location: 'Building B, Floor 3'
    }
  ];

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            DEBUG: Department Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Testing action buttons functionality with detailed logging
          </p>
        </div>

        {/* Click Log */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Click Activity Log
          </h3>
          <div className="max-h-40 overflow-y-auto">
            {clickLog.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 italic">No clicks recorded yet</p>
            ) : (
              clickLog.map((log, index) => (
                <div key={index} className="text-sm text-gray-700 dark:text-gray-300 py-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Test Buttons Row */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Standalone Test Buttons
          </h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => addToLog('Standalone View Details clicked')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <BuildingOfficeIcon className="w-4 h-4" />
              View Details
            </button>
            <button
              onClick={() => addToLog('Standalone Edit clicked')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => addToLog('Standalone Manage Head clicked')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <UserIcon className="w-4 h-4" />
              Manage Head
            </button>
            <button
              onClick={() => addToLog('Standalone Delete clicked')}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Mock Department Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Head
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Employees
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {mockDepartments.map((department) => (
                <tr key={department._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {department.dept_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {department.department_head?.username || 'Not assigned'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {department.employeeCount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {department.location || 'Not specified'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToLog(`Table View Details clicked for ${department.dept_name}`);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded"
                        title="View Details"
                      >
                        <BuildingOfficeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToLog(`Table Edit clicked for ${department.dept_name}`);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded"
                        title="Edit Department"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToLog(`Table Manage Head clicked for ${department.dept_name}`);
                        }}
                        className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 p-1 rounded"
                        title="Manage Department Head"
                      >
                        <UserIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToLog(`Table Delete clicked for ${department.dept_name}`);
                        }}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"
                        title="Delete Department"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            Debugging Instructions:
          </h3>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• Click the standalone buttons first to verify basic click functionality</li>
            <li>• Then click the table action buttons to test within table context</li>
            <li>• Check browser console for additional debug messages</li>
            <li>• Watch for success notifications in top-right corner</li>
            <li>• Activity log will show all click events with timestamps</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DebugDepartmentManagement;
