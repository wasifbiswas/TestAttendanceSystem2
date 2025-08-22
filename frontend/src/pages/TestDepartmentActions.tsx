import React, { useState } from 'react';
import { FaEye, FaEdit, FaUserTie, FaTrash } from 'react-icons/fa';
import { showNotification } from '../utils/notifications';

// Simple test component to check if action buttons work
const TestDepartmentActions: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');

  const testActions = {
    viewDetails: () => {
      console.log('View Details clicked');
      setTestResult('View Details action triggered successfully');
      showNotification('View Details button is working!', 'success');
    },
    
    editDepartment: () => {
      console.log('Edit Department clicked');
      setTestResult('Edit Department action triggered successfully');
      showNotification('Edit Department button is working!', 'success');
    },
    
    manageHead: () => {
      console.log('Manage Head clicked');
      setTestResult('Manage Head action triggered successfully');
      showNotification('Manage Head button is working!', 'success');
    },
    
    deleteDepartment: () => {
      console.log('Delete Department clicked');
      setTestResult('Delete Department action triggered successfully');
      showNotification('Delete Department button is working!', 'success');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Department Action Buttons Test
        </h1>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Click each button to test if actions are working properly:
          </p>
          
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={testActions.viewDetails}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaEye />
              View Details
            </button>
            
            <button
              onClick={testActions.editDepartment}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaEdit />
              Edit Department
            </button>
            
            <button
              onClick={testActions.manageHead}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FaUserTie />
              Manage Head
            </button>
            
            <button
              onClick={testActions.deleteDepartment}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <FaTrash />
              Delete Department
            </button>
          </div>
          
          {testResult && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">
                Test Result: {testResult}
              </p>
            </div>
          )}
        </div>
        
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Click each button above</li>
            <li>Check the browser console for log messages</li>
            <li>Look for success notifications in the top-right corner</li>
            <li>Verify the test result appears below the buttons</li>
          </ol>
        </div>
        
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            <strong>Note:</strong> If these buttons work but the Department Management buttons don't,
            there might be an issue with event propagation, z-index, or modal rendering in the main component.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestDepartmentActions;
