import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Toast from '../components/Toast';
import { updateSystemSettings } from '../api/admin';
// Import each icon individually
import { FaCog } from 'react-icons/fa';
import { FaRegClock } from 'react-icons/fa';
import { FaUserClock } from 'react-icons/fa';
import { FaClipboardList } from 'react-icons/fa';
import { FaBell } from 'react-icons/fa';
import { FaDatabase } from 'react-icons/fa';
import { FaPlug } from 'react-icons/fa';
import GoogleCalendarSettings from '../components/GoogleCalendarSettings';

// Define interface for system settings
interface SystemSettings {
  workHours: {
    startTime: string;
    endTime: string;
    workDays: string[];
    flexibleHours: boolean;
    graceTimeMinutes: number;
  };
  attendance: {
    autoMarkAbsent: boolean;
    requireGeoLocation: boolean;
    allowRemoteCheckin: boolean;
    latenessThresholdMinutes: number;
  };
  leave: {
    approvalRequired: boolean;
    minAdvanceRequestDays: number;
    allowHalfDayLeave: boolean;
    defaultAnnualLeaveQuota: number;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    dailyReports: boolean;
    leaveRequestUpdates: boolean;
  };
  dataRetention: {
    attendanceHistoryMonths: number;
    reportRetentionMonths: number;
    autoArchive: boolean;
  };
  integrations: {
    googleCalendar: {
      autoSyncHolidays: boolean;
      autoSyncLeave: boolean;
      autoSyncSchedule: boolean;
    };
  };
}

const defaultSettings: SystemSettings = {
  workHours: {
    startTime: '09:00',
    endTime: '17:00',
    workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    flexibleHours: false,
    graceTimeMinutes: 15,
  },
  attendance: {
    autoMarkAbsent: true,
    requireGeoLocation: false,
    allowRemoteCheckin: true,
    latenessThresholdMinutes: 30,
  },
  leave: {
    approvalRequired: true,
    minAdvanceRequestDays: 3,
    allowHalfDayLeave: true,
    defaultAnnualLeaveQuota: 20,
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: false,
    dailyReports: true,
    leaveRequestUpdates: true,
  },
  dataRetention: {
    attendanceHistoryMonths: 12,
    reportRetentionMonths: 36,
    autoArchive: true,
  },
  integrations: {
    googleCalendar: {
      autoSyncHolidays: false,
      autoSyncLeave: false,
      autoSyncSchedule: false,
    },
  },
};

const SystemSettings = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('workHours');
  const [toast, setToast] = useState({ 
    visible: false, 
    message: '', 
    type: 'info' as 'success' | 'error' | 'info' 
  });

  useEffect(() => {
    // Check if user is admin, redirect to regular dashboard if not
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }

    // Fetch system settings (mock for now)
    fetchSettings();
  }, [isAdmin, navigate]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      // Mock API call - in a real app, this would fetch from backend
      // For now we'll use the default settings
      // const data = await getSystemSettings();
      // setSettings(data);

      // Simulate API delay
      setTimeout(() => {
        setSettings(defaultSettings);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setToast({
        visible: true,
        message: 'Failed to load system settings',
        type: 'error'
      });
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Mock API call - in a real app, this would send to backend
      await updateSystemSettings(settings);
      setToast({
        visible: true,
        message: 'Settings saved successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      setToast({
        visible: true,
        message: 'Failed to save settings',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (section: keyof SystemSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleCheckboxChange = (section: keyof SystemSettings, field: string) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: !prev[section][field as keyof typeof prev[section]]
      }
    }));
  };

  const handleWorkDayToggle = (day: string) => {
    const { workDays } = settings.workHours;
    const updatedWorkDays = workDays.includes(day)
      ? workDays.filter(d => d !== day)
      : [...workDays, day];
    
    handleChange('workHours', 'workDays', updatedWorkDays);
  };

  // Tabs configuration
  const tabs = [
    { id: 'workHours', label: 'Working Hours', icon: <FaRegClock /> },
    { id: 'attendance', label: 'Attendance', icon: <FaUserClock /> },
    { id: 'leave', label: 'Leave', icon: <FaClipboardList /> },
    { id: 'notifications', label: 'Notifications', icon: <FaBell /> },
    { id: 'dataRetention', label: 'Data Retention', icon: <FaDatabase /> },
    { id: 'integrations', label: 'Integrations', icon: <FaPlug /> },
  ];

  if (isLoading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
            <FaCog className="mr-3 text-blue-500" />
            System Settings
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure system-wide settings and preferences
          </p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className={`px-4 py-2 rounded-md ${
            isSaving 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white flex items-center`}
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Settings
            </>
          )}
        </button>
      </motion.div>

      {/* Toast notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
        duration={5000}
      />

      {/* Settings Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-6">
        <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-4 text-sm font-medium flex items-center whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Working Hours Settings */}
          {activeTab === 'workHours' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Working Hours Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Work Day Start Time
                  </label>
                  <input
                    type="time"
                    value={settings.workHours.startTime}
                    onChange={(e) => handleChange('workHours', 'startTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    aria-label="Work Day Start Time"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Work Day End Time
                  </label>
                  <input
                    type="time"
                    value={settings.workHours.endTime}
                    onChange={(e) => handleChange('workHours', 'endTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    aria-label="Work Day End Time"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Work Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleWorkDayToggle(day)}
                      className={`px-3 py-2 rounded-md text-sm ${
                        settings.workHours.workDays.includes(day)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Grace Time (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={settings.workHours.graceTimeMinutes}
                    onChange={(e) => handleChange('workHours', 'graceTimeMinutes', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    aria-label="Grace Time in Minutes"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Time allowed after start time before marking as late
                  </p>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="flexible-hours"
                    type="checkbox"
                    checked={settings.workHours.flexibleHours}
                    onChange={() => handleCheckboxChange('workHours', 'flexibleHours')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="flexible-hours" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Enable flexible hours
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Settings */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Attendance Tracking Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="auto-mark-absent"
                      type="checkbox"
                      checked={settings.attendance.autoMarkAbsent}
                      onChange={() => handleCheckboxChange('attendance', 'autoMarkAbsent')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="auto-mark-absent" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Automatically mark as absent if no check-in
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="require-geolocation"
                      type="checkbox"
                      checked={settings.attendance.requireGeoLocation}
                      onChange={() => handleCheckboxChange('attendance', 'requireGeoLocation')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="require-geolocation" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Require geolocation for check-in/out
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="allow-remote"
                      type="checkbox"
                      checked={settings.attendance.allowRemoteCheckin}
                      onChange={() => handleCheckboxChange('attendance', 'allowRemoteCheckin')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="allow-remote" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Allow remote check-in
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lateness Threshold (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={settings.attendance.latenessThresholdMinutes}
                    onChange={(e) => handleChange('attendance', 'latenessThresholdMinutes', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    aria-label="Lateness Threshold in Minutes"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Minutes after which an employee is marked as late
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Leave Settings */}
          {activeTab === 'leave' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Leave Management Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="approval-required"
                      type="checkbox"
                      checked={settings.leave.approvalRequired}
                      onChange={() => handleCheckboxChange('leave', 'approvalRequired')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="approval-required" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Require approval for leave requests
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="half-day-leave"
                      type="checkbox"
                      checked={settings.leave.allowHalfDayLeave}
                      onChange={() => handleCheckboxChange('leave', 'allowHalfDayLeave')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="half-day-leave" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Allow half-day leave requests
                    </label>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Minimum Advance Notice (days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={settings.leave.minAdvanceRequestDays}
                      onChange={(e) => handleChange('leave', 'minAdvanceRequestDays', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      aria-label="Minimum Advance Notice in Days"
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Minimum days in advance for leave requests
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Default Annual Leave Quota
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={settings.leave.defaultAnnualLeaveQuota}
                      onChange={(e) => handleChange('leave', 'defaultAnnualLeaveQuota', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      aria-label="Default Annual Leave Quota"
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Default annual leave days per employee
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notification Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
                <div className="flex items-center">
                  <input
                    id="email-notifications"
                    type="checkbox"
                    checked={settings.notifications.emailNotifications}
                    onChange={() => handleCheckboxChange('notifications', 'emailNotifications')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="email-notifications" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Enable email notifications
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="push-notifications"
                    type="checkbox"
                    checked={settings.notifications.pushNotifications}
                    onChange={() => handleCheckboxChange('notifications', 'pushNotifications')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="push-notifications" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Enable push notifications
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="daily-reports"
                    type="checkbox"
                    checked={settings.notifications.dailyReports}
                    onChange={() => handleCheckboxChange('notifications', 'dailyReports')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="daily-reports" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Send daily attendance reports
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="leave-updates"
                    type="checkbox"
                    checked={settings.notifications.leaveRequestUpdates}
                    onChange={() => handleCheckboxChange('notifications', 'leaveRequestUpdates')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="leave-updates" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Notify on leave request updates
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Data Retention Settings */}
          {activeTab === 'dataRetention' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Data Retention Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Attendance History Retention (months)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.dataRetention.attendanceHistoryMonths}
                    onChange={(e) => handleChange('dataRetention', 'attendanceHistoryMonths', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    aria-label="Attendance History Retention in Months"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    How long to keep detailed attendance records
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Report Retention (months)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={settings.dataRetention.reportRetentionMonths}
                    onChange={(e) => handleChange('dataRetention', 'reportRetentionMonths', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    aria-label="Report Retention in Months"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    How long to keep generated reports
                  </p>
                </div>
                
                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      id="auto-archive"
                      type="checkbox"
                      checked={settings.dataRetention.autoArchive}
                      onChange={() => handleCheckboxChange('dataRetention', 'autoArchive')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="auto-archive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Automatically archive old data
                    </label>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 pl-6">
                    When enabled, data beyond retention periods will be archived rather than deleted
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Integrations Settings */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">External Integrations</h3>
              
              <GoogleCalendarSettings 
                initialSettings={settings.integrations.googleCalendar}
                onChange={(googleCalendarSettings) => {
                  setSettings(prev => ({
                    ...prev,
                    integrations: {
                      ...prev.integrations,
                      googleCalendar: googleCalendarSettings
                    }
                  }));
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className={`px-4 py-2 rounded-md ${
            isSaving 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default SystemSettings; 