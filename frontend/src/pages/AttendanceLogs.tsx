import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FaArrowLeft, FaCalendarAlt, FaFileDownload, FaFilter } from 'react-icons/fa';
import { AttendanceFilter, AttendanceRecord, getAttendanceLogs } from '../api/attendance';
import { BiLoaderAlt } from 'react-icons/bi';
import { format, parseISO } from 'date-fns';

const AttendanceLogs: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isManager, department } = useAuthStore();
  
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  // Filters
  const [filters, setFilters] = useState<AttendanceFilter>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // default to last 30 days
    endDate: new Date().toISOString().split('T')[0],
    status: '',
    employeeId: '',
    departmentId: ''
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [recordsPerPage] = useState<number>(10);
  
  // Get current records for pagination
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = attendanceRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(attendanceRecords.length / recordsPerPage);

  useEffect(() => {
    fetchAttendanceLogs();
  }, []);

  const fetchAttendanceLogs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let records: AttendanceRecord[] = [];
      
      if (isAdmin) {
        // Admin can see all attendance logs with filters
        records = await getAttendanceLogs(filters);
      } else if (isManager) {
        // Manager can see department attendance with filters
        // For managers, we need to determine their department
        if (!user) {
          throw new Error("User information not found. Please login again.");
        }
        
        // Use the department from the authStore state
        const departmentId = department || '';
        
        if (!departmentId) {
          throw new Error("Department information not found. Please contact administrator.");
        }
        
        records = await getAttendanceLogs({
          ...filters,
          departmentId
        });
      } else {
        // Regular users can only see their own attendance
        // This assumes the API provides a way to get attendance for the logged-in user
        try {
          // Fetch user's own attendance records
          records = await getAttendanceLogs({
            ...filters,
            employeeId: user?._id
          });
        } catch (fetchError) {
          console.error("Error fetching user attendance:", fetchError);
          throw new Error("Failed to fetch your attendance records. Please contact support.");
        }
      }
      
      setAttendanceRecords(records);
      setCurrentPage(1); // Reset to first page when data changes
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance logs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAttendanceLogs();
  };

  // Calculate work hours from check-in and check-out times
  const calculateWorkHours = (checkIn: string | null, checkOut: string | null): string => {
    if (!checkIn || !checkOut) return '-';
    
    const checkInTime = new Date(checkIn).getTime();
    const checkOutTime = new Date(checkOut).getTime();
    
    const diffMs = checkOutTime - checkInTime;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  // Format time to display in 12-hour format
  const formatTime = (dateString: string | null): string => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'hh:mm a');
    } catch (error) {
      return '-';
    }
  };

  // Format date to display in readable format
  const formatDate = (dateString: string): string => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
          aria-label="Go back"
        >
          <FaArrowLeft className="text-xl" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Attendance Logs</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
            <FaCalendarAlt className="mr-2" /> 
            Attendance Records
          </h2>
          
          <div className="flex items-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg mr-4"
            >
              <FaFilter className="mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            
            <button
              onClick={() => {
                // This is a placeholder. In a real app, you would implement export functionality
                alert('Export functionality would be implemented here');
              }}
              className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              <FaFileDownload className="mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Filters section */}
        {showFilters && (
          <form onSubmit={handleApplyFilters} className="mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                >
                  <option value="">All Statuses</option>
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="LEAVE">Leave</option>
                  <option value="HOLIDAY">Holiday</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="WEEKEND">Weekend</option>
                </select>
              </div>
              
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    name="employeeId"
                    value={filters.employeeId}
                    onChange={handleFilterChange}
                    placeholder="Filter by employee ID"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  />
                </div>
              )}
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setFilters({
                    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
                    endDate: new Date().toISOString().split('T')[0],
                    status: '',
                    employeeId: '',
                    departmentId: ''
                  });
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white px-4 py-2 rounded-lg mr-2"
              >
                Reset
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Apply Filters
              </button>
            </div>
          </form>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        )}

        {/* Attendance records table */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <BiLoaderAlt className="animate-spin text-blue-600 text-4xl" />
          </div>
        ) : attendanceRecords.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>No attendance records found for the selected filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    {(isAdmin || isManager) && (
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Employee
                      </th>
                    )}
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Check-In
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Check-Out
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Work Hours
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {currentRecords.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {formatDate(record.attendance_date)}
                      </td>
                      {(isAdmin || isManager) && (
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                          {record.emp_id.user_id.full_name || record.emp_id.user_id.username}
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {record.emp_id.employee_code} | {record.emp_id.designation}
                          </div>
                        </td>
                      )}
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {formatTime(record.check_in)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {formatTime(record.check_out)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {calculateWorkHours(record.check_in, record.check_out)}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${record.status === 'PRESENT' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''}
                          ${record.status === 'ABSENT' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : ''}
                          ${record.status === 'LEAVE' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                          ${record.status === 'HOLIDAY' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : ''}
                          ${record.status === 'HALF_DAY' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                          ${record.status === 'WEEKEND' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : ''}
                        `}>
                          {record.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {record.remarks || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{indexOfFirstRecord + 1}</span> to <span className="font-medium">
                    {Math.min(indexOfLastRecord, attendanceRecords.length)}
                  </span> of <span className="font-medium">{attendanceRecords.length}</span> records
                </div>
                
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <div className="px-3 py-1 rounded-md bg-blue-600 text-white">
                    {currentPage}
                  </div>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceLogs;