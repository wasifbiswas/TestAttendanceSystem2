// New file to fix the employee deletion functionality
import api from './axios';

/**
 * Delete an employee by ID
 * @param id Employee ID to delete
 * @returns API response
 */
export const deleteEmployee = async (id: string) => {
  try {
    // Check if ID is valid
    if (!id || typeof id !== 'string') {
      throw new Error(`Invalid employee ID: ${id} - ID must be a string`);
    }
    
    console.log(`Attempting to delete employee with ID: ${id}`);
    
    // The backend route is defined at /api/employees/:id in employeeRoutes.js
    // Since the axios instance already has /api as the baseURL, we just need to use /employees/:id
    const response = await api.delete(`/employees/${id}`);
    console.log('Delete employee response:', response);
    
    return response;
  } catch (err: any) {
    console.error('API Error deleting employee:', err);
    
    // More detailed error logging
    if (err.response) {
      console.error('Response error data:', err.response.data);
      console.error('Response error status:', err.response.status);
    } else if (err.request) {
      console.error('No response received:', err.request);
    } else {
      console.error('Request setup error:', err.message);
    }
    
    const errorMessage = err.response?.data?.message || 'Failed to delete employee';
    throw new Error(errorMessage);
  }
};
