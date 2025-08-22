import DepartmentAPI, { Department } from '../api/departmentApi';

/**
 * Centralized department utilities to ensure consistency across the application
 * All department-related functionality should use these utilities
 */

// Cache for departments to avoid unnecessary API calls
let cachedDepartments: Department[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get all active departments - used throughout the application
 * @param forceRefresh - Force refresh from API even if cached
 * @returns Promise<Department[]>
 */
export const getActiveDepartments = async (forceRefresh = false): Promise<Department[]> => {
  try {
    // Check if we have valid cached data
    if (!forceRefresh && cachedDepartments && cacheTimestamp && 
        (Date.now() - cacheTimestamp < CACHE_DURATION)) {
      console.log('Using cached departments');
      return cachedDepartments;
    }

    console.log('Fetching departments from API');
    const response = await DepartmentAPI.getAll({ status: 'ACTIVE' });
    
    // Update cache
    cachedDepartments = response.departments;
    cacheTimestamp = Date.now();
    
    console.log(`Fetched ${cachedDepartments.length} active departments:`, 
      cachedDepartments.map(d => ({ id: d._id, name: d.dept_name })));
    
    return cachedDepartments;
  } catch (error) {
    console.error('Error fetching departments:', error);
    
    // Return cached data if available, even if stale
    if (cachedDepartments) {
      console.warn('Using stale cached departments due to API error');
      return cachedDepartments;
    }
    
    // Return empty array if no cache available
    console.warn('No departments available - returning empty array');
    return [];
  }
};

/**
 * Get department by ID
 * @param departmentId - The department ID to find
 * @returns Promise<Department | null>
 */
export const getDepartmentById = async (departmentId: string): Promise<Department | null> => {
  try {
    const departments = await getActiveDepartments();
    return departments.find(d => d._id === departmentId) || null;
  } catch (error) {
    console.error('Error getting department by ID:', error);
    return null;
  }
};

/**
 * Get department name by ID
 * @param departmentId - The department ID
 * @returns Promise<string>
 */
export const getDepartmentName = async (departmentId: string): Promise<string> => {
  try {
    const department = await getDepartmentById(departmentId);
    return department?.dept_name || 'Unknown Department';
  } catch (error) {
    console.error('Error getting department name:', error);
    return 'Unknown Department';
  }
};

/**
 * Clear department cache - call this after creating/updating/deleting departments
 */
export const clearDepartmentCache = (): void => {
  cachedDepartments = null;
  cacheTimestamp = null;
  console.log('Department cache cleared');
};

/**
 * Format departments for dropdown/select components
 * @returns Promise<Array<{value: string, label: string}>>
 */
export const getDepartmentsForSelect = async (): Promise<Array<{value: string, label: string}>> => {
  try {
    const departments = await getActiveDepartments();
    return departments.map(dept => ({
      value: dept._id,
      label: dept.dept_name
    }));
  } catch (error) {
    console.error('Error formatting departments for select:', error);
    return [];
  }
};

/**
 * Check if a department exists and is active
 * @param departmentId - The department ID to check
 * @returns Promise<boolean>
 */
export const isDepartmentActive = async (departmentId: string): Promise<boolean> => {
  try {
    const department = await getDepartmentById(departmentId);
    return department !== null && department.status === 'ACTIVE';
  } catch (error) {
    console.error('Error checking if department is active:', error);
    return false;
  }
};
