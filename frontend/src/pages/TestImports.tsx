// Test imports to verify module resolution
import React from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import CreateDepartmentModal from '../components/departments/CreateDepartmentModal';
import EditDepartmentModal from '../components/departments/EditDepartmentModal';
import DeleteDepartmentModal from '../components/departments/DeleteDepartmentModal';
import AssignHeadModal from '../components/departments/AssignHeadModal';
import DepartmentDetailsModal from '../components/departments/DepartmentDetailsModal';
import DepartmentAPI from '../api/departmentApi';

// Simple test component to verify imports
const TestImports: React.FC = () => {
  return (
    <div>
      <h1>Import Test</h1>
      <LoadingSpinner />
      <p>All imports successful</p>
    </div>
  );
};

export default TestImports;
