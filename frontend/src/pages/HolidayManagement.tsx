import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FaCalendarAlt, FaPlus, FaTrash, FaArrowLeft } from 'react-icons/fa';
import Toast from '../components/Toast';
import HolidaySyncButton from '../components/HolidaySyncButton';

// Define interface for holiday data
interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'public' | 'company' | 'optional';
}

const HolidayManagement = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isAddingHoliday, setIsAddingHoliday] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ 
    visible: false, 
    message: '', 
    type: 'info' as 'success' | 'error' | 'info' 
  });
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: 'company' as 'public' | 'company' | 'optional'
  });

  // Mock data for initial development
  const mockHolidays: Holiday[] = [
    {
      id: '1',
      name: 'New Year\'s Day',
      date: `${selectedYear}-01-01`,
      type: 'public'
    },
    {
      id: '2',
      name: 'Independence Day',
      date: `${selectedYear}-07-04`,
      type: 'public'
    },
    {
      id: '3',
      name: 'Labor Day',
      date: `${selectedYear}-09-05`,
      type: 'public'
    },
    {
      id: '4',
      name: 'Thanksgiving Day',
      date: `${selectedYear}-11-24`,
      type: 'public'
    },
    {
      id: '5',
      name: 'Christmas Day',
      date: `${selectedYear}-12-25`,
      type: 'public'
    },
    {
      id: '6',
      name: 'Company Anniversary',
      date: `${selectedYear}-03-15`,
      type: 'company'
    },
    {
      id: '7',
      name: 'Team Building Day',
      date: `${selectedYear}-06-15`,
      type: 'company'
    }
  ];

  useEffect(() => {
    // Check if user is admin, redirect to regular dashboard if not
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }

    // Fetch holidays data
    fetchHolidays();
  }, [isAdmin, navigate, selectedYear]);

  const fetchHolidays = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, we would fetch from the API
      // const response = await getHolidays(selectedYear);
      // setHolidays(response.data);
      
      // For now, use mock data
      setTimeout(() => {
        setHolidays(mockHolidays);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching holidays:', error);
      showToast('Failed to load holidays', 'error');
      setIsLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({
      visible: true,
      message,
      type
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // In a real implementation, we would call the API
      // await addHoliday(formData);
      
      // For now, just update the local state
      const newHoliday: Holiday = {
        id: Date.now().toString(),
        name: formData.name,
        date: formData.date,
        type: formData.type
      };
      
      setHolidays([...holidays, newHoliday]);
      setFormData({
        name: '',
        date: '',
        type: 'company'
      });
      setIsAddingHoliday(false);
      
      showToast('Holiday added successfully', 'success');
    } catch (error) {
      console.error('Error adding holiday:', error);
      showToast('Failed to add holiday', 'error');
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this holiday?')) {
      try {
        // In a real implementation, we would call the API
        // await deleteHoliday(id);
        
        // For now, just update the local state
        setHolidays(holidays.filter(holiday => holiday.id !== id));
        
        showToast('Holiday deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting holiday:', error);
        showToast('Failed to delete holiday', 'error');
      }
    }
  };

  const getHolidayTypeStyles = (type: string) => {
    switch (type) {
      case 'public':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-400';
      case 'company':
        return 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400';
      case 'optional':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-800/30 dark:text-amber-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400';
    }
  };

  const AddHolidayForm = () => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Add New Holiday
        </h2>
        <button 
          onClick={() => setIsAddingHoliday(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close form"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <form onSubmit={handleAddHoliday}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Holiday Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="e.g. Company Anniversary"
              aria-label="Holiday Name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              aria-label="Holiday Date"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              aria-label="Holiday Type"
            >
              <option value="public">Public Holiday</option>
              <option value="company">Company Holiday</option>
              <option value="optional">Optional Holiday</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => setIsAddingHoliday(false)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 mr-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Holiday
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
        duration={5000}
      />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/admin')}
            className="mr-4 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
            aria-label="Go back to admin dashboard"
          >
            <FaArrowLeft className="text-xl" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <FaCalendarAlt className="mr-3 text-blue-500" />
            Holiday Management
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            aria-label="Select year"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          <HolidaySyncButton 
            holidays={holidays}
            onSuccess={() => showToast('Holidays synced to Google Calendar', 'success')}
            onError={(error) => showToast(`Failed to sync holidays: ${error}`, 'error')}
          />
          
          {!isAddingHoliday && (
            <button
              onClick={() => setIsAddingHoliday(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FaPlus className="mr-2" />
              Add Holiday
            </button>
          )}
        </div>
      </div>

      {isAddingHoliday && <AddHolidayForm />}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">Holidays for {selectedYear}</h2>
        </div>
        
        {isLoading ? (
          <div className="p-6 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {holidays.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {holidays
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((holiday) => (
                      <tr key={holiday.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(holiday.date).toLocaleDateString('en-GB')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {holiday.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getHolidayTypeStyles(holiday.type)}`}>
                            {holiday.type.charAt(0).toUpperCase() + holiday.type.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {holiday.type !== 'public' && (
                            <button
                              onClick={() => handleDeleteHoliday(holiday.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              aria-label={`Delete ${holiday.name}`}
                            >
                              <FaTrash />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                No holidays found for {selectedYear}.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HolidayManagement;