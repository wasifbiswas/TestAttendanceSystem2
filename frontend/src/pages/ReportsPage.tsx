import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaFileAlt, FaFileDownload, FaCalendarAlt, FaServer, FaLaptop } from 'react-icons/fa';
import { useAdminAPI } from '../api/admin';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import { fetchDataAndGenerateReport, ReportFormat } from '../utils/reportGenerator';

type ReportType = 'attendance' | 'employees' | 'leaves' | 'performance';
type GenerationMode = 'server' | 'client';

interface ReportOption {
  id: ReportType;
  name: string;
  description: string;
  icon: React.ReactNode;
  availableFormats: string[];
}

interface ReportsPageProps {
  departmentOnly?: boolean;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ departmentOnly = false }) => {
  const { department } = useAuthStore();
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [format, setFormat] = useState<string>('pdf');
  const [loading, setLoading] = useState<boolean>(false);
  const [generationMode, setGenerationMode] = useState<GenerationMode>('server');
  
  const navigate = useNavigate();
  const { showToast } = useToast();  const { 
    generateAttendanceReport,
    generateEmployeeReport,
    generateLeaveReport,
    generatePerformanceReport,
    fetchReportData
  } = useAdminAPI();

  const reportOptions: ReportOption[] = [
    {
      id: 'attendance',
      name: departmentOnly ? `${department} Attendance Report` : 'Attendance Report',
      description: departmentOnly
        ? `Generate reports on ${department} department employee attendance.`
        : 'Generate reports on employee attendance, including check-in/out times and overtime.',
      icon: <FaCalendarAlt className="text-blue-500 text-2xl" />,
      availableFormats: ['pdf', 'excel', 'csv']
    },
    {
      id: 'employees',
      name: departmentOnly ? `${department} Employee Details` : 'Employee Details Report',
      description: departmentOnly
        ? `Comprehensive report on all ${department} department employee information.`
        : 'Comprehensive report on all employee information and status.',
      icon: <FaFileAlt className="text-green-500 text-2xl" />,
      availableFormats: ['pdf', 'excel']
    },
    {
      id: 'leaves',
      name: departmentOnly ? `${department} Leave Report` : 'Leave Management Report',
      description: departmentOnly
        ? `Report on leave requests and approvals for ${department} department.`
        : 'Report on leave requests, approvals, and remaining leave balances.',
      icon: <FaFileAlt className="text-amber-500 text-2xl" />,
      availableFormats: ['pdf', 'excel', 'csv']
    }
  ];
  
  // Only show performance metrics for admin (not department managers)
  if (!departmentOnly) {
    reportOptions.push({
      id: 'performance',
      name: 'Performance Metrics',
      description: 'Employee performance data based on attendance and other metrics.',
      icon: <FaFileAlt className="text-purple-500 text-2xl" />,
      availableFormats: ['pdf', 'excel']
    });
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange({
      ...dateRange,
      [name]: value
    });
  };

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormat(e.target.value);
  };

  const handleReportSelection = (reportType: ReportType) => {
    setSelectedReport(reportType);

    // Set default format for the selected report
    const selectedReportOption = reportOptions.find(option => option.id === reportType);
    if (selectedReportOption && selectedReportOption.availableFormats.length > 0) {
      setFormat(selectedReportOption.availableFormats[0]);
    }
  };

  // Helper function to download a blob as a file
  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };
  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReport) return;
    
    setLoading(true);
    
    try {
      const reportName = getReportName(selectedReport);
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `${reportName.replace(/\s+/g, '_')}_${timestamp}.${format}`;
      let reportBlob: Blob;
        if (generationMode === 'client') {
        // Fetch data for client-side report generation
        const params = {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          departmentId: departmentOnly ? department : undefined
        };
        
        // First fetch the raw data from the API
        const reportData = await fetchReportData(selectedReport, params);
          // Then generate the report in the browser using the utility functions
        const { blob } = await fetchDataAndGenerateReport(
          selectedReport,
          format as ReportFormat,
          {
            apiEndpoint: `/admin/reports/${selectedReport}`,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            departmentId: departmentOnly ? department : undefined,
            departmentName: departmentOnly ? department : undefined,
            // Pass the already fetched data to avoid double API calls
            reportData
          }
        );
        
        reportBlob = blob;
      } else {
        // Use server-side report generation via API
        if (departmentOnly && department) {
          switch (selectedReport) {
            case 'attendance':
              reportBlob = await generateAttendanceReport(
                dateRange.startDate,
                dateRange.endDate,
                format,
                department
              );
              break;
            case 'employees':
              reportBlob = await generateEmployeeReport(format, department);
              break;
            case 'leaves':
              reportBlob = await generateLeaveReport(
                dateRange.startDate,
                dateRange.endDate,
                format,
                department
              );
              break;
            default:
              throw new Error('Invalid report type for department manager');
          }
        } else {
          // Admin full report generation
          switch (selectedReport) {
            case 'attendance':
              reportBlob = await generateAttendanceReport(
                dateRange.startDate,
                dateRange.endDate,
                format
              );
              break;
            case 'employees':
              reportBlob = await generateEmployeeReport(format);
              break;
            case 'leaves':
              reportBlob = await generateLeaveReport(
                dateRange.startDate,
                dateRange.endDate,
                format
              );
              break;
            case 'performance':
              reportBlob = await generatePerformanceReport(
                dateRange.startDate,
                dateRange.endDate,
                format
              );
              break;
            default:
              throw new Error('Invalid report type');
          }
        }
      }
      
      // Download the generated report
      downloadBlob(reportBlob, fileName);
      
      showToast({
        message: `${getReportName(selectedReport)} generated and downloaded successfully`,
        type: 'success'
      });
    } catch (error) {
      console.error('Report generation error:', error);
      showToast({
        message: 'Failed to generate report. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const getReportName = (reportType: ReportType): string => {
    const report = reportOptions.find(r => r.id === reportType);
    return report ? report.name : 'Report';
  };

  const ReportSelectionView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {reportOptions.map((option) => (
        <div
          key={option.id}
          onClick={() => handleReportSelection(option.id)}
          className={`cursor-pointer p-6 rounded-lg border-2 transition-all
            ${selectedReport === option.id
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-800'
            }`}
        >
          <div className="flex items-start">
            <div className="mr-4">{option.icon}</div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{option.name}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">{option.description}</p>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Available formats: {option.availableFormats.join(', ')}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
    const ReportConfigForm = () => {
    const selectedReportOption = reportOptions.find(option => option.id === selectedReport);
    
    if (!selectedReportOption) return null;
    
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Configure {selectedReportOption.name}
          </h2>
          <button 
            onClick={() => setSelectedReport(null)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Go back to report selection"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleGenerateReport}>
          <div className="space-y-6">
            {/* Processing mode selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Report Generation Mode
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setGenerationMode('server')}
                  className={`flex items-center px-4 py-2 rounded-md ${
                    generationMode === 'server'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  <FaServer className="mr-2" />
                  Server-side
                </button>
                <button
                  type="button"
                  onClick={() => setGenerationMode('client')}
                  className={`flex items-center px-4 py-2 rounded-md ${
                    generationMode === 'client'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  <FaLaptop className="mr-2" />
                  Client-side
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {generationMode === 'server' 
                  ? 'Server-side: Reports are generated on the server which handles large datasets better.'
                  : 'Client-side: Reports are generated in your browser for faster processing with fewer server resources.'}
              </p>
            </div>
            
            {/* Date range selection */}
            {selectedReport !== 'employees' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={dateRange.startDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    aria-label="Start Date"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={dateRange.endDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    aria-label="End Date"
                  />
                </div>
              </div>
            )}
            
            {/* Format selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Report Format
              </label>
              <select
                value={format}
                onChange={handleFormatChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                aria-label="Report Format"
              >
                {selectedReportOption.availableFormats.map((formatOption) => (
                  <option key={formatOption} value={formatOption}>
                    {formatOption.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center px-4 py-2 rounded-md text-white
                ${loading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : generationMode === 'client'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <FaFileDownload className="mr-2" />
                  Generate & Download Report {generationMode === 'client' ? '(Client-side)' : ''}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(departmentOnly ? '/manager' : '/admin')}
          className="mr-4 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
          aria-label={departmentOnly ? "Go back to manager dashboard" : "Go back to admin dashboard"}
        >
          <FaArrowLeft className="text-xl" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Report Generation</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        {selectedReport ? <ReportConfigForm /> : <ReportSelectionView />}
      </div>
    </div>
  );
};

export default ReportsPage;