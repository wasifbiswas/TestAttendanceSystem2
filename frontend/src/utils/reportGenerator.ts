import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

export type ReportFormat = 'pdf' | 'excel' | 'csv';
export type ReportType = 'attendance' | 'employees' | 'leaves' | 'performance';

export interface ReportData {
  title: string;
  subtitle?: string;
  metadata?: Record<string, string>;
  headers: string[];
  data: Record<string, any>[];
  columns: string[];
}

export interface ReportOptions {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  departmentName?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Generate a report client-side
 */
export const generateReport = (
  reportData: ReportData,
  format: ReportFormat,
  options: ReportOptions = {}
): Blob => {
  switch (format) {
    case 'excel':
      return generateExcelReport(reportData, options);
    case 'csv':
      return generateCsvReport(reportData, options);
    case 'pdf':
    default:
      return generatePdfReport(reportData, options);
  }
};

/**
 * Generate Excel report
 */
const generateExcelReport = (reportData: ReportData, options: ReportOptions): Blob => {
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Format data for Excel
  const excelData = [
    // Headers row
    reportData.headers
  ];
  
  // Add data rows
  reportData.data.forEach(item => {
    const row = reportData.columns.map(col => item[col] !== undefined ? item[col] : '');
    excelData.push(row);
  });
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(excelData);
  
  // Add title info to another sheet if needed
  const metadataSheet = XLSX.utils.aoa_to_sheet([
    ['Report Title', reportData.title],
    ['Generated On', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
    options.departmentName ? ['Department', options.departmentName] : ['', ''],
    options.startDate ? ['Start Date', options.startDate] : ['', ''],
    options.endDate ? ['End Date', options.endDate] : ['', '']
  ]);
  
  // Add worksheets to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Report Data');
  XLSX.utils.book_append_sheet(wb, metadataSheet, 'Report Info');
  
  // Generate Excel binary
  const excelBinary = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
  
  // Convert binary to Blob
  const buffer = new ArrayBuffer(excelBinary.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < excelBinary.length; i++) {
    view[i] = excelBinary.charCodeAt(i) & 0xFF;
  }
  
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

/**
 * Generate CSV report
 */
const generateCsvReport = (reportData: ReportData, options: ReportOptions): Blob => {
  // Start with headers
  let csvContent = reportData.headers.join(',') + '\\r\\n';
  
  // Add data rows
  reportData.data.forEach(item => {
    const row = reportData.columns.map(col => {
      const value = item[col] !== undefined ? item[col] : '';
      // Escape commas and quotes in values
      return typeof value === 'string' ? 
        `"${value.replace(/"/g, '""')}"` : 
        value;
    });
    csvContent += row.join(',') + '\\r\\n';
  });
  
  // Add metadata as comments at the top
  let metadataContent = `# ${reportData.title}\\r\\n`;
  metadataContent += `# Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\\r\\n`;
  
  if (options.departmentName) {
    metadataContent += `# Department: ${options.departmentName}\\r\\n`;
  }
  
  if (options.startDate && options.endDate) {
    metadataContent += `# Period: ${options.startDate} to ${options.endDate}\\r\\n`;
  }
  
  csvContent = metadataContent + '\\r\\n' + csvContent;
  
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
};

/**
 * Generate PDF report
 */
const generatePdfReport = (reportData: ReportData, options: ReportOptions): Blob => {
  // Create document with appropriate orientation
  const orientation = options.orientation || 'portrait';
  const doc = new jsPDF(orientation);
  
  const pageWidth = orientation === 'portrait' ? 210 : 297; // A4 width in mm
  
  // Add title
  doc.setFontSize(18);
  doc.text(reportData.title, pageWidth / 2, 20, { align: 'center' });
  
  // Add subtitle if provided
  if (reportData.subtitle) {
    doc.setFontSize(14);
    doc.text(reportData.subtitle, pageWidth / 2, 30, { align: 'center' });
  }
  
  // Add metadata
  let yPos = 40;
  doc.setFontSize(10);
  doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, pageWidth / 2, yPos, { align: 'center' });
  
  if (options.departmentName) {
    yPos += 6;
    doc.text(`Department: ${options.departmentName}`, pageWidth / 2, yPos, { align: 'center' });
  }
  
  if (options.startDate && options.endDate) {
    yPos += 6;
    doc.text(`Period: ${options.startDate} to ${options.endDate}`, pageWidth / 2, yPos, { align: 'center' });
  }
  
  yPos += 15;
    // Calculate column widths based on available space
  const tableWidth = pageWidth - 40; // 20mm margin on each side
  const colWidths: number[] = [];
  
  // Simple algorithm to calculate column widths based on header length
  const totalChars = reportData.headers.reduce((sum, header) => sum + header.length, 0);
  for (let i = 0; i < reportData.headers.length; i++) {
    const proportion = reportData.headers[i].length / totalChars;
    colWidths[i] = Math.max(tableWidth * proportion, 15); // Minimum 15mm width
  }
  
  // Table headers with background
  let xPos = 20; // Start 20mm from left
  
  doc.setFillColor(240, 240, 240);
  doc.rect(xPos, yPos, tableWidth, 8, 'F');
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  // Draw header cells
  for (let i = 0; i < reportData.headers.length; i++) {
    doc.text(reportData.headers[i], xPos + 2, yPos + 5);
    xPos += colWidths[i];
  }
  
  // Move to next row
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  
  // Add data rows
  reportData.data.forEach((item, rowIndex) => {
    // Check if we need a new page
    if (yPos > doc.internal.pageSize.height - 20) {
      doc.addPage();
      yPos = 20;
      
      // Add headers on new page
      xPos = 20;
      doc.setFillColor(240, 240, 240);
      doc.rect(xPos, yPos, tableWidth, 8, 'F');
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      
      // Draw header cells on new page
      for (let i = 0; i < reportData.headers.length; i++) {
        doc.text(reportData.headers[i], xPos + 2, yPos + 5);
        xPos += colWidths[i];
      }
      
      yPos += 8;
      doc.setFont('helvetica', 'normal');
    }
    
    // Add a light background for alternate rows
    if (rowIndex % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(20, yPos, tableWidth, 6, 'F');
    }
    
    // Draw row data
    xPos = 20;
    for (let i = 0; i < reportData.columns.length; i++) {
      const value = item[reportData.columns[i]] !== undefined ? 
        String(item[reportData.columns[i]]) : '';
      
      doc.text(value, xPos + 2, yPos + 4);
      xPos += colWidths[i];
    }
    
    yPos += 6;
  });
    // Add page numbers
  const totalPages = doc.getNumberOfPages ? doc.getNumberOfPages() : doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 25, doc.internal.pageSize.height - 10);
  }
  
  // Return PDF as blob
  return doc.output('blob');
};

// Helper function to fetch data and generate report
export const fetchDataAndGenerateReport = async (
  reportType: ReportType,
  reportFormat: ReportFormat,
  options: {
    apiEndpoint: string;
    startDate?: string;
    endDate?: string;
    departmentId?: string;
    departmentName?: string;
    reportData?: any;  // Pre-fetched report data to use instead of generating mock data
  }
): Promise<{ blob: Blob, filename: string }> => {
  try {    // Determine filename
    const timestamp = format(new Date(), 'yyyy-MM-dd');
    let reportName = '';
    
    switch (reportType) {
      case 'attendance':
        reportName = 'Attendance_Report';
        break;
      case 'employees':
        reportName = 'Employee_Report';
        break;
      case 'leaves':
        reportName = 'Leave_Report';
        break;
      case 'performance':
        reportName = 'Performance_Report';
        break;
    }
    
    if (options.departmentName) {
      reportName = `${options.departmentName}_${reportName}`;
    }
      const filename = `${reportName}_${timestamp}.${reportFormat}`;
    
    // Use provided data if available, otherwise generate mock data
    const reportData = options.reportData || generateMockData(reportType, options);
    
    // Generate report
    const blob = generateReport(reportData, reportFormat, {
      filename,
      orientation: (reportType === 'attendance' || reportType === 'leaves') ? 'landscape' : 'portrait',
      departmentName: options.departmentName,
      startDate: options.startDate,
      endDate: options.endDate
    });
    
    return { blob, filename };
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

/**
 * Generate mock data for reports
 */
const generateMockData = (reportType: ReportType, options: any): ReportData => {
  // Extract options - including unused ones to avoid linter warnings
  const { departmentName } = options;
  
  let title = '';
  let headers: string[] = [];
  let columns: string[] = [];
  let data: Record<string, any>[] = [];
  
  switch (reportType) {
    case 'attendance':
      title = departmentName ? 
        `${departmentName} Attendance Report` : 
        'Attendance Report';
        
      headers = ['Date', 'Employee Name', 'Employee Code', 'Email', 'Check In', 'Check Out', 'Status', 'Work Hours'];
      columns = ['date', 'employeeName', 'employeeCode', 'email', 'checkIn', 'checkOut', 'status', 'workHours'];
      
      data = [
        { 
          date: '2025-05-08', 
          employeeName: 'John Doe', 
          employeeCode: 'EMP001', 
          email: 'john@example.com',
          checkIn: '09:00:00',
          checkOut: '17:30:00',
          status: 'PRESENT',
          workHours: 8.5
        },
        { 
          date: '2025-05-08', 
          employeeName: 'Jane Smith', 
          employeeCode: 'EMP002', 
          email: 'jane@example.com',
          checkIn: '08:45:00',
          checkOut: '17:15:00',
          status: 'PRESENT',
          workHours: 8.5
        },
        { 
          date: '2025-05-08', 
          employeeName: 'Michael Johnson', 
          employeeCode: 'EMP003', 
          email: 'michael@example.com',
          checkIn: null,
          checkOut: null,
          status: 'ABSENT',
          workHours: 0
        },
        // Add more mock data...
      ];
      break;
      
    case 'employees':
      title = departmentName ? 
        `${departmentName} Employee Report` : 
        'Employee Report';
        
      headers = ['Employee Code', 'Name', 'Email', 'Department', 'Position', 'Join Date', 'Status'];
      columns = ['employeeCode', 'name', 'email', 'department', 'position', 'joinDate', 'status'];
      
      data = [
        { 
          employeeCode: 'EMP001', 
          name: 'John Doe', 
          email: 'john@example.com',
          department: departmentName || 'Engineering',
          position: 'Senior Developer',
          joinDate: '2023-01-15',
          status: 'Active'
        },
        { 
          employeeCode: 'EMP002', 
          name: 'Jane Smith', 
          email: 'jane@example.com',
          department: departmentName || 'Marketing',
          position: 'Marketing Specialist',
          joinDate: '2023-03-20',
          status: 'Active'
        },
        { 
          employeeCode: 'EMP003', 
          name: 'Michael Johnson', 
          email: 'michael@example.com',
          department: departmentName || 'HR',
          position: 'HR Coordinator',
          joinDate: '2023-02-10',
          status: 'Inactive'
        },
        // Add more mock data...
      ];
      break;
      
    case 'leaves':
      title = departmentName ? 
        `${departmentName} Leave Report` : 
        'Leave Report';
        
      headers = ['Employee Name', 'Employee Code', 'Email', 'Leave Type', 'Start Date', 'End Date', 'Duration (Days)', 'Status', 'Reason', 'Applied Date'];
      columns = ['employeeName', 'employeeCode', 'email', 'leaveType', 'startDate', 'endDate', 'duration', 'status', 'reason', 'appliedDate'];
      
      data = [
        { 
          employeeName: 'John Doe', 
          employeeCode: 'EMP001', 
          email: 'john@example.com',
          leaveType: 'Annual Leave',
          startDate: '2025-05-15',
          endDate: '2025-05-20',
          duration: 6,
          status: 'APPROVED',
          reason: 'Family vacation',
          appliedDate: '2025-04-20'
        },
        { 
          employeeName: 'Jane Smith', 
          employeeCode: 'EMP002', 
          email: 'jane@example.com',
          leaveType: 'Sick Leave',
          startDate: '2025-05-10',
          endDate: '2025-05-12',
          duration: 3,
          status: 'APPROVED',
          reason: 'Medical appointment',
          appliedDate: '2025-05-08'
        },
        { 
          employeeName: 'Michael Johnson', 
          employeeCode: 'EMP003', 
          email: 'michael@example.com',
          leaveType: 'Unpaid Leave',
          startDate: '2025-06-01',
          endDate: '2025-06-15',
          duration: 15,
          status: 'PENDING',
          reason: 'Personal matters',
          appliedDate: '2025-05-01'
        },
        // Add more mock data...
      ];
      break;
      
    case 'performance':
      title = 'Performance Report';
        
      headers = ['Employee Name', 'Employee Code', 'Department', 'Position', 'Days Present', 'Days Absent', 'Days On Leave', 'Attendance %', 'Avg Work Hours', 'On Time %', 'Performance Score'];
      columns = ['employeeName', 'employeeCode', 'department', 'position', 'daysPresent', 'daysAbsent', 'daysOnLeave', 'attendancePercentage', 'avgWorkHours', 'onTimeArrival', 'performanceScore'];
      
      data = [
        { 
          employeeName: 'John Doe', 
          employeeCode: 'EMP001', 
          department: departmentName || 'Engineering',
          position: 'Senior Developer',
          daysPresent: 20,
          daysAbsent: 1,
          daysOnLeave: 2,
          attendancePercentage: '95.65%',
          avgWorkHours: '8.2',
          onTimeArrival: '92.00%',
          performanceScore: 'A'
        },
        { 
          employeeName: 'Jane Smith', 
          employeeCode: 'EMP002', 
          department: departmentName || 'Marketing',
          position: 'Marketing Specialist',
          daysPresent: 18,
          daysAbsent: 3,
          daysOnLeave: 2,
          attendancePercentage: '86.96%',
          avgWorkHours: '8.0',
          onTimeArrival: '88.89%',
          performanceScore: 'B'
        },
        { 
          employeeName: 'Michael Johnson', 
          employeeCode: 'EMP003', 
          department: departmentName || 'HR',
          position: 'HR Coordinator',
          daysPresent: 21,
          daysAbsent: 0,
          daysOnLeave: 2,
          attendancePercentage: '100.00%',
          avgWorkHours: '8.5',
          onTimeArrival: '95.24%',
          performanceScore: 'A'
        },
        // Add more mock data...
      ];
      break;
  }
  
  return {
    title,
    headers,
    columns,
    data
  };
};
