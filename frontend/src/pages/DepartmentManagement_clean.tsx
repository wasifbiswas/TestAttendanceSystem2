import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  UserIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  BanknotesIcon,
  MapPinIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { showNotification } from '../utils/notifications';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import CreateDepartmentModal from '../components/departments/CreateDepartmentModal';
import EditDepartmentModal from '../components/departments/EditDepartmentModal';
import DeleteDepartmentModal from '../components/departments/DeleteDepartmentModal';
import AssignHeadModal from '../components/departments/AssignHeadModal';
import DepartmentDetailsModal from '../components/departments/DepartmentDetailsModal';
import DepartmentAPI, { Department, DepartmentStats, PaginationParams } from '../api/departmentApi';

const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<DepartmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalDepartments: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignHeadModal, setShowAssignHeadModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const itemsPerPage = 10;

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const params: PaginationParams = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        sort: 'dept_name',
        order: 'asc'
      };

      const response = await DepartmentAPI.getAll(params);
      setDepartments(response.departments);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching departments:', error);
      showNotification('Failed to fetch departments', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const statsData = await DepartmentAPI.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching department stats:', error);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchStats();
  }, [currentPage, searchTerm, statusFilter]);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle status filter change
  const handleStatusFilterChange = (status: 'ALL' | 'ACTIVE' | 'INACTIVE') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  // Handle create department
  const handleCreateDepartment = async (data: any) => {
    try {
      await DepartmentAPI.create(data);
      showNotification('Department created successfully');
      setShowCreateModal(false);
      fetchDepartments();
      fetchStats();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to create department', 'error');
    }
  };

  // Handle edit department
  const handleEditDepartment = async (data: any) => {
    if (!selectedDepartment) return;
    
    try {
      await DepartmentAPI.update(selectedDepartment._id, data);
      showNotification('Department updated successfully');
      setShowEditModal(false);
      setSelectedDepartment(null);
      fetchDepartments();
      fetchStats();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to update department', 'error');
    }
  };

  // Handle delete department
  const handleDeleteDepartment = async () => {
    if (!selectedDepartment) return;
    
    try {
      await DepartmentAPI.delete(selectedDepartment._id);
      showNotification('Department deleted successfully');
      setShowDeleteModal(false);
      setSelectedDepartment(null);
      fetchDepartments();
      fetchStats();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to delete department', 'error');
    }
  };

  // Handle assign department head
  const handleAssignHead = async (employeeId: string) => {
    if (!selectedDepartment) return;
    
    try {
      await DepartmentAPI.assignHead(selectedDepartment._id, employeeId);
      showNotification('Department head assigned successfully');
      setShowAssignHeadModal(false);
      setSelectedDepartment(null);
      fetchDepartments();
      fetchStats();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to assign department head', 'error');
    }
  };

  // Handle remove department head
  const handleRemoveHead = async () => {
    if (!selectedDepartment) return;
    
    try {
      await DepartmentAPI.removeHead(selectedDepartment._id);
      showNotification('Department head removed successfully');
      setShowAssignHeadModal(false);
      setSelectedDepartment(null);
      fetchDepartments();
      fetchStats();
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Failed to remove department head', 'error');
    }
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading && departments.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Department Management</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage departments, assign heads, and track department statistics
          </p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <BuildingOfficeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Departments</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalDepartments}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Departments</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.activeDepartments}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <UserIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">With Department Heads</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.departmentsWithHeads}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <BuildingOfficeIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive Departments</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.inactiveDepartments}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search departments..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full sm:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="ALL">All Departments</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>

            {/* Create Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Department
            </button>
          </div>
        </div>

        {/* Departments Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Employees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Department Head
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Budget
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
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      Loading departments...
                    </td>
                  </tr>
                ) : departments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No departments found
                    </td>
                  </tr>
                ) : (
                  departments.map((department) => (
                    <tr key={department._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {department.dept_name}
                          </div>
                          {department.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {department.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          department.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                            : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                        }`}>
                          {department.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900 dark:text-white">
                          <UserGroupIcon className="w-4 h-4 mr-1 text-gray-400" />
                          {department.employee_count}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {department.dept_head_id ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {department.dept_head_id.user_id.full_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {department.dept_head_id.employee_code}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900 dark:text-white">
                          <BanknotesIcon className="w-4 h-4 mr-1 text-gray-400" />
                          {formatCurrency(department.budget)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <MapPinIcon className="w-4 h-4 mr-1" />
                          {department.location || 'Not specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedDepartment(department);
                              setShowDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="View Details"
                          >
                            <BuildingOfficeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDepartment(department);
                              setShowEditModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Edit Department"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDepartment(department);
                              setShowAssignHeadModal(true);
                            }}
                            className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                            title="Manage Department Head"
                          >
                            <UserIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDepartment(department);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete Department"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, pagination.totalDepartments)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.totalDepartments}</span> departments
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNumber = Math.max(1, Math.min(pagination.totalPages - 4, currentPage - 2)) + i;
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNumber === currentPage
                              ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-200'
                              : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        {showCreateModal && (
          <CreateDepartmentModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateDepartment}
          />
        )}

        {showEditModal && selectedDepartment && (
          <EditDepartmentModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedDepartment(null);
            }}
            onSubmit={handleEditDepartment}
            department={selectedDepartment}
          />
        )}

        {showDeleteModal && selectedDepartment && (
          <DeleteDepartmentModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedDepartment(null);
            }}
            onConfirm={handleDeleteDepartment}
            department={selectedDepartment}
          />
        )}

        {showAssignHeadModal && selectedDepartment && (
          <AssignHeadModal
            isOpen={showAssignHeadModal}
            onClose={() => {
              setShowAssignHeadModal(false);
              setSelectedDepartment(null);
            }}
            onAssign={handleAssignHead}
            onRemove={handleRemoveHead}
            department={selectedDepartment}
          />
        )}

        {showDetailsModal && selectedDepartment && (
          <DepartmentDetailsModal
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedDepartment(null);
            }}
            department={selectedDepartment}
          />
        )}
      </div>
    </div>
  );
};

export default DepartmentManagement;
