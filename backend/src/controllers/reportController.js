import { startOfDay, endOfDay, format } from "date-fns";
import { createObjectCsvWriter } from "csv-writer";
import * as ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import os from "os";

// Import models
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import LeaveRequest from "../models/LeaveRequest.js";

/**
 * Generate temporary file path
 */
const getTempFilePath = (filename) => {
  const tempDir = path.join(os.tmpdir(), "attendance-system-reports");

  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  return path.join(tempDir, filename);
};

/**
 * Generate attendance report
 */
export const generateAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, format = "pdf", departmentId } = req.query;
    const isDataOnly = req.path.endsWith("/data");

    // If this is a data-only request, just return the raw data rather than a formatted report
    if (isDataOnly) {
      return res.json({
        title: "Attendance Report",
        columns: [
          "date",
          "employeeName",
          "employeeCode",
          "email",
          "checkIn",
          "checkOut",
          "status",
          "workHours",
        ],
        headers: [
          "Date",
          "Employee Name",
          "Employee Code",
          "Email",
          "Check In",
          "Check Out",
          "Status",
          "Work Hours",
        ],
        metadata: {
          startDate,
          endDate,
          departmentId,
          generatedAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        },
        data: [], // The frontend will generate mock data
      });
    }

    // Validate dates
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required" });
    }

    // Parse dates
    const startDateTime = startOfDay(new Date(startDate));
    const endDateTime = endOfDay(new Date(endDate));

    // Build query
    const query = {
      attendance_date: {
        $gte: startDateTime,
        $lte: endDateTime,
      },
    };

    // If departmentId is provided, filter by department
    let departmentFilter = {};
    if (departmentId) {
      // Get all employees in the department
      const employees = await Employee.find({ dept_id: departmentId });
      const employeeIds = employees.map((emp) => emp._id);

      // Add employee filter to query
      query.emp_id = { $in: employeeIds };

      // Get department name for the report title
      const department = await Department.findById(departmentId);
      departmentFilter = {
        name: department?.dept_name || "Unknown Department",
      };
    }

    // Get attendance records with employee and user info
    const attendanceRecords = await Attendance.find(query)
      .sort({ attendance_date: 1 })
      .populate({
        path: "emp_id",
        populate: {
          path: "user_id",
          select: "full_name email",
        },
      });

    // Format data for the report
    const reportData = attendanceRecords.map((record) => ({
      date: format(new Date(record.attendance_date), "yyyy-MM-dd"),
      employeeName: record.emp_id?.user_id?.full_name || "Unknown",
      employeeCode: record.emp_id?.employee_code || "N/A",
      email: record.emp_id?.user_id?.email || "N/A",
      checkIn: record.check_in
        ? format(new Date(record.check_in), "HH:mm:ss")
        : "Not checked in",
      checkOut: record.check_out
        ? format(new Date(record.check_out), "HH:mm:ss")
        : "Not checked out",
      status: record.status || "Unknown",
      workHours: record.work_hours?.toFixed(2) || "N/A",
    }));

    // Generate report based on format
    switch (format.toLowerCase()) {
      case "excel":
        return await generateExcelReport(
          "Attendance_Report",
          reportData,
          [
            "Date",
            "Employee Name",
            "Employee Code",
            "Email",
            "Check In",
            "Check Out",
            "Status",
            "Work Hours",
          ],
          [
            "date",
            "employeeName",
            "employeeCode",
            "email",
            "checkIn",
            "checkOut",
            "status",
            "workHours",
          ],
          res,
          {
            startDate,
            endDate,
            ...departmentFilter,
          }
        );
      case "csv":
        return await generateCsvReport(
          "Attendance_Report",
          reportData,
          [
            "date",
            "employeeName",
            "employeeCode",
            "email",
            "checkIn",
            "checkOut",
            "status",
            "workHours",
          ],
          [
            "Date",
            "Employee Name",
            "Employee Code",
            "Email",
            "Check In",
            "Check Out",
            "Status",
            "Work Hours",
          ],
          res
        );
      case "pdf":
      default:
        return await generatePdfReport(
          "Attendance Report",
          reportData,
          [
            "Date",
            "Employee",
            "Code",
            "Email",
            "Check In",
            "Check Out",
            "Status",
            "Hours",
          ],
          [
            "date",
            "employeeName",
            "employeeCode",
            "email",
            "checkIn",
            "checkOut",
            "status",
            "workHours",
          ],
          res,
          {
            startDate,
            endDate,
            ...departmentFilter,
          }
        );
    }
  } catch (error) {
    console.error("Error generating attendance report:", error);
    return res
      .status(500)
      .json({ message: "Failed to generate attendance report" });
  }
};

/**
 * Generate employee report
 */
export const generateEmployeeReport = async (req, res) => {
  try {
    const { format = "pdf", departmentId } = req.query;
    const isDataOnly = req.path.endsWith("/data");

    // If this is a data-only request, just return the raw data rather than a formatted report
    if (isDataOnly) {
      return res.json({
        title: "Employee Report",
        columns: [
          "employeeCode",
          "name",
          "email",
          "department",
          "position",
          "joinDate",
          "status",
        ],
        headers: [
          "Employee Code",
          "Name",
          "Email",
          "Department",
          "Position",
          "Join Date",
          "Status",
        ],
        metadata: {
          departmentId,
          generatedAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        },
        data: [], // The frontend will generate mock data
      });
    }

    // Build query
    const query = {};

    // If departmentId is provided, filter by department
    let departmentFilter = {};
    if (departmentId) {
      // Add department filter to query
      query.dept_id = departmentId;

      // Get department name for the report title
      const department = await Department.findById(departmentId);
      departmentFilter = {
        name: department?.dept_name || "Unknown Department",
      };
    }

    // Get employees with user and department info
    const employees = await Employee.find(query)
      .sort({ employee_code: 1 })
      .populate("user_id", "full_name email")
      .populate("dept_id", "dept_name");

    // Format data for the report
    const reportData = employees.map((emp) => ({
      employeeCode: emp.employee_code || "N/A",
      name: emp.user_id?.full_name || "Unknown",
      email: emp.user_id?.email || "N/A",
      department: emp.dept_id?.dept_name || "No Department",
      position: emp.position || "N/A",
      joinDate: emp.join_date
        ? format(new Date(emp.join_date), "yyyy-MM-dd")
        : "N/A",
      status: emp.status || "Unknown",
    }));

    // Generate report based on format
    switch (format.toLowerCase()) {
      case "excel":
        return await generateExcelReport(
          "Employee_Report",
          reportData,
          [
            "Employee Code",
            "Name",
            "Email",
            "Department",
            "Position",
            "Join Date",
            "Status",
          ],
          [
            "employeeCode",
            "name",
            "email",
            "department",
            "position",
            "joinDate",
            "status",
          ],
          res,
          departmentFilter
        );
      case "csv":
        return await generateCsvReport(
          "Employee_Report",
          reportData,
          [
            "employeeCode",
            "name",
            "email",
            "department",
            "position",
            "joinDate",
            "status",
          ],
          [
            "Employee Code",
            "Name",
            "Email",
            "Department",
            "Position",
            "Join Date",
            "Status",
          ],
          res
        );
      case "pdf":
      default:
        return await generatePdfReport(
          "Employee Report",
          reportData,
          [
            "Code",
            "Name",
            "Email",
            "Department",
            "Position",
            "Join Date",
            "Status",
          ],
          [
            "employeeCode",
            "name",
            "email",
            "department",
            "position",
            "joinDate",
            "status",
          ],
          res,
          departmentFilter
        );
    }
  } catch (error) {
    console.error("Error generating employee report:", error);
    return res
      .status(500)
      .json({ message: "Failed to generate employee report" });
  }
};

/**
 * Generate leave report
 */
export const generateLeaveReport = async (req, res) => {
  try {
    const { startDate, endDate, format = "pdf", departmentId } = req.query;
    const isDataOnly = req.path.endsWith("/data");

    // If this is a data-only request, just return the raw data rather than a formatted report
    if (isDataOnly) {
      return res.json({
        title: "Leave Report",
        columns: [
          "employeeName",
          "employeeCode",
          "email",
          "leaveType",
          "startDate",
          "endDate",
          "duration",
          "status",
          "reason",
          "appliedDate",
        ],
        headers: [
          "Employee Name",
          "Employee Code",
          "Email",
          "Leave Type",
          "Start Date",
          "End Date",
          "Duration (Days)",
          "Status",
          "Reason",
          "Applied Date",
        ],
        metadata: {
          startDate,
          endDate,
          departmentId,
          generatedAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        },
        data: [], // The frontend will generate mock data
      });
    }

    // Validate dates
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required" });
    }

    // Parse dates
    const startDateTime = startOfDay(new Date(startDate));
    const endDateTime = endOfDay(new Date(endDate));

    // Build query
    const query = {
      $or: [
        { start_date: { $gte: startDateTime, $lte: endDateTime } },
        { end_date: { $gte: startDateTime, $lte: endDateTime } },
        {
          $and: [
            { start_date: { $lte: startDateTime } },
            { end_date: { $gte: endDateTime } },
          ],
        },
      ],
    };

    // If departmentId is provided, filter by department
    let departmentFilter = {};
    if (departmentId) {
      // Get all employees in the department
      const employees = await Employee.find({ dept_id: departmentId });
      const employeeIds = employees.map((emp) => emp._id);

      // Add employee filter to query
      query.emp_id = { $in: employeeIds };

      // Get department name for the report title
      const department = await Department.findById(departmentId);
      departmentFilter = {
        name: department?.dept_name || "Unknown Department",
      };
    }

    // Get leave requests with employee and leave type info
    const leaveRequests = await LeaveRequest.find(query)
      .sort({ applied_date: -1 })
      .populate({
        path: "emp_id",
        populate: {
          path: "user_id",
          select: "full_name email",
        },
      })
      .populate("leave_type_id", "leave_name leave_code");

    // Format data for the report
    const reportData = leaveRequests.map((leave) => ({
      employeeName: leave.emp_id?.user_id?.full_name || "Unknown",
      employeeCode: leave.emp_id?.employee_code || "N/A",
      email: leave.emp_id?.user_id?.email || "N/A",
      leaveType: leave.leave_type_id?.leave_name || "Unknown",
      startDate: format(new Date(leave.start_date), "MMM dd, yyyy"),
      endDate: format(new Date(leave.end_date), "MMM dd, yyyy"),
      duration: leave.duration
        ? `${leave.duration} day${leave.duration !== 1 ? "s" : ""}`
        : "0",
      status: leave.status
        ? leave.status.charAt(0).toUpperCase() + leave.status.slice(1)
        : "Unknown",
      // Truncate reason if it's too long for PDF display
      reason: leave.reason
        ? leave.reason.length > 100
          ? leave.reason.substring(0, 97) + "..."
          : leave.reason
        : "No reason provided",
      appliedDate: format(new Date(leave.applied_date), "MMM dd, yyyy"),
    }));

    // Generate report based on format
    switch (format.toLowerCase()) {
      case "excel":
        return await generateExcelReport(
          "Leave_Report",
          reportData,
          [
            "Employee Name",
            "Employee Code",
            "Email",
            "Leave Type",
            "Start Date",
            "End Date",
            "Duration (Days)",
            "Status",
            "Reason",
            "Applied Date",
          ],
          [
            "employeeName",
            "employeeCode",
            "email",
            "leaveType",
            "startDate",
            "endDate",
            "duration",
            "status",
            "reason",
            "appliedDate",
          ],
          res,
          {
            startDate,
            endDate,
            ...departmentFilter,
          }
        );
      case "csv":
        return await generateCsvReport(
          "Leave_Report",
          reportData,
          [
            "employeeName",
            "employeeCode",
            "email",
            "leaveType",
            "startDate",
            "endDate",
            "duration",
            "status",
            "reason",
            "appliedDate",
          ],
          [
            "Employee Name",
            "Employee Code",
            "Email",
            "Leave Type",
            "Start Date",
            "End Date",
            "Duration (Days)",
            "Status",
            "Reason",
            "Applied Date",
          ],
          res
        );
      case "pdf":
      default:
        return await generatePdfReport(
          "Leave Report",
          reportData,
          [
            "Employee",
            "Code",
            "Email",
            "Leave Type",
            "Start Date",
            "End Date",
            "Days",
            "Status",
            "Reason",
            "Applied Date",
          ],
          [
            "employeeName",
            "employeeCode",
            "email",
            "leaveType",
            "startDate",
            "endDate",
            "duration",
            "status",
            "reason",
            "appliedDate",
          ],
          res,
          {
            startDate,
            endDate,
            ...departmentFilter,
          }
        );
    }
  } catch (error) {
    console.error("Error generating leave report:", error);
    return res.status(500).json({ message: "Failed to generate leave report" });
  }
};

/**
 * Generate performance report
 */
export const generatePerformanceReport = async (req, res) => {
  try {
    const { startDate, endDate, format = "pdf", departmentId } = req.query;
    const isDataOnly = req.path.endsWith("/data");

    // If this is a data-only request, just return the raw data rather than a formatted report
    if (isDataOnly) {
      return res.json({
        title: "Performance Report",
        columns: [
          "employeeName",
          "employeeCode",
          "department",
          "position",
          "daysPresent",
          "daysAbsent",
          "daysOnLeave",
          "attendancePercentage",
          "avgWorkHours",
          "onTimeArrival",
          "performanceScore",
        ],
        headers: [
          "Employee Name",
          "Employee Code",
          "Department",
          "Position",
          "Days Present",
          "Days Absent",
          "Days On Leave",
          "Attendance %",
          "Avg Work Hours",
          "On Time %",
          "Performance Score",
        ],
        metadata: {
          startDate,
          endDate,
          departmentId,
          generatedAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        },
        data: [], // The frontend will generate mock data
      });
    }

    // Validate dates
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required" });
    }

    // Parse dates
    const startDateTime = startOfDay(new Date(startDate));
    const endDateTime = endOfDay(new Date(endDate));

    // Get employees with user info
    const employees = await Employee.find({ status: "active" })
      .sort({ employee_code: 1 })
      .populate("user_id", "full_name email")
      .populate("dept_id", "dept_name");

    // Collect performance data for each employee
    const performanceData = await Promise.all(
      employees.map(async (emp) => {
        try {
          // Get attendance records for date range
          const attendanceRecords = await Attendance.find({
            emp_id: emp._id,
            attendance_date: {
              $gte: startDateTime,
              $lte: endDateTime,
            },
          });

          // Get leave records for date range
          const leaveRequests = await LeaveRequest.find({
            emp_id: emp._id,
            status: "APPROVED",
            $or: [
              { start_date: { $gte: startDateTime, $lte: endDateTime } },
              { end_date: { $gte: startDateTime, $lte: endDateTime } },
            ],
          });

          // Calculate metrics
          const totalWorkingDays =
            Math.round((endDateTime - startDateTime) / (1000 * 60 * 60 * 24)) +
            1;
          const daysPresent = attendanceRecords.filter(
            (rec) => rec.status === "PRESENT"
          ).length;
          const daysAbsent = attendanceRecords.filter(
            (rec) => rec.status === "ABSENT"
          ).length;
          const daysOnLeave = leaveRequests.reduce(
            (total, leave) => total + leave.duration,
            0
          );
          const totalWorkHours = attendanceRecords.reduce(
            (total, rec) => total + (rec.work_hours || 0),
            0
          );
          const avgWorkHours =
            daysPresent > 0 ? totalWorkHours / daysPresent : 0;
          const attendancePercentage =
            totalWorkingDays > 0
              ? ((daysPresent + daysOnLeave) / totalWorkingDays) * 100
              : 0;
          const onTimeArrival = attendanceRecords.filter(
            (rec) => rec.status === "PRESENT" && rec.on_time_arrival
          ).length;
          const onTimePercentage =
            daysPresent > 0 ? (onTimeArrival / daysPresent) * 100 : 0;

          return {
            employeeName: emp.user_id?.full_name || "Unknown",
            employeeCode: emp.employee_code || "N/A",
            email: emp.user_id?.email || "N/A",
            department: emp.dept_id?.dept_name || "No Department",
            position: emp.position || "N/A",
            daysPresent,
            daysAbsent,
            daysOnLeave,
            attendancePercentage: attendancePercentage.toFixed(2) + "%",
            avgWorkHours: avgWorkHours.toFixed(2),
            onTimeArrival: onTimePercentage.toFixed(2) + "%",
            performanceScore: calculatePerformanceScore(
              attendancePercentage,
              onTimePercentage
            ),
          };
        } catch (err) {
          console.error(
            `Error processing performance data for employee ${emp._id}:`,
            err
          );
          return null;
        }
      })
    );

    // Filter out any null values from errors
    const reportData = performanceData.filter(Boolean);

    // Generate report based on format
    switch (format.toLowerCase()) {
      case "excel":
        return await generateExcelReport(
          "Performance_Report",
          reportData,
          [
            "Employee Name",
            "Employee Code",
            "Email",
            "Department",
            "Position",
            "Days Present",
            "Days Absent",
            "Days On Leave",
            "Attendance %",
            "Avg Work Hours",
            "On Time %",
            "Performance Score",
          ],
          [
            "employeeName",
            "employeeCode",
            "email",
            "department",
            "position",
            "daysPresent",
            "daysAbsent",
            "daysOnLeave",
            "attendancePercentage",
            "avgWorkHours",
            "onTimeArrival",
            "performanceScore",
          ],
          res,
          {
            startDate,
            endDate,
          }
        );
      case "pdf":
      default:
        return await generatePdfReport(
          "Performance Report",
          reportData,
          [
            "Employee",
            "Code",
            "Department",
            "Position",
            "Present",
            "Absent",
            "Leave",
            "Attend %",
            "Avg Hours",
            "On Time %",
            "Score",
          ],
          [
            "employeeName",
            "employeeCode",
            "department",
            "position",
            "daysPresent",
            "daysAbsent",
            "daysOnLeave",
            "attendancePercentage",
            "avgWorkHours",
            "onTimeArrival",
            "performanceScore",
          ],
          res,
          {
            startDate,
            endDate,
          }
        );
    }
  } catch (error) {
    console.error("Error generating performance report:", error);
    return res
      .status(500)
      .json({ message: "Failed to generate performance report" });
  }
};

/**
 * Calculate performance score based on attendance and punctuality
 */
const calculatePerformanceScore = (attendancePercentage, onTimePercentage) => {
  // Simple scoring algorithm: 70% weight to attendance, 30% to punctuality
  const score = attendancePercentage * 0.7 + onTimePercentage * 0.3;

  // Convert to letter grade
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
};

/**
 * Generate Excel report
 */
const generateExcelReport = async (
  reportName,
  data,
  headers,
  fields,
  res,
  metadata = {}
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(reportName);

  // Add metadata/title
  if (metadata) {
    const titleRow = worksheet.addRow([""]);
    titleRow.font = { bold: true, size: 16 };

    const reportTitle = metadata.name
      ? `${reportName} - ${metadata.name}`
      : reportName;

    worksheet.addRow([reportTitle]);

    if (metadata.startDate && metadata.endDate) {
      worksheet.addRow([
        `Period: ${metadata.startDate} to ${metadata.endDate}`,
      ]);
    }

    worksheet.addRow([""]); // Empty row
  }

  // Add headers
  const headerRow = worksheet.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD3D3D3" },
  };

  // Add data rows
  data.forEach((item) => {
    const rowData = fields.map((field) =>
      item[field] !== undefined ? item[field] : ""
    );
    worksheet.addRow(rowData);
  });

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    column.width = Math.max(
      12,
      ...data.map((item) => {
        const field = column._header;
        const value = item[field] !== undefined ? String(item[field]) : "";
        return value.length;
      })
    );
  });
  // Create temp file with unique name
  const tempFilePath = getTempFilePath(
    `${reportName}_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 10)}.xlsx`
  );

  try {
    // Write to file
    await workbook.xlsx.writeFile(tempFilePath);

    // Clear any existing headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${reportName}.xlsx"`
    );
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    // Read file as buffer and send directly
    const fileContent = fs.readFileSync(tempFilePath);
    res.send(fileContent);
    // Delete temp file after sending
    fs.unlink(tempFilePath, (err) => {
      if (err) console.error("Error deleting Excel temp file:", err);
    });
  } catch (error) {
    console.error("Error generating Excel file:", error);
    throw error;
  }
};

/**
 * Generate CSV report
 */
const generateCsvReport = async (reportName, data, fields, headers, res) => {
  try {
    // Create temp file with unique name
    const tempFilePath = getTempFilePath(
      `${reportName}_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 10)}.csv`
    );

    // Create CSV writer
    const csvWriter = createObjectCsvWriter({
      path: tempFilePath,
      header: fields.map((field, index) => ({
        id: field,
        title: headers[index],
      })),
    });

    // Write records
    await csvWriter.writeRecords(data);

    // Set headers
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${reportName}.csv"`
    );
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    // Read file and send directly
    const fileContent = fs.readFileSync(tempFilePath);
    res.send(fileContent);

    // Delete temp file after sending
    fs.unlink(tempFilePath, (err) => {
      if (err) console.error("Error deleting CSV temp file:", err);
    });
  } catch (error) {
    console.error("Error generating CSV file:", error);
    throw error;
  }
};

/**
 * Generate PDF report
 */
const generatePdfReport = async (
  reportTitle,
  data,
  headers,
  fields,
  res,
  metadata = {}
) => {
  // Create temp file with unique name to avoid conflicts
  const tempFilePath = getTempFilePath(
    `${reportTitle.replace(/\s+/g, "_")}_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 10)}.pdf`
  );
  // Create PDF document with proper settings - increase margins for better layout
  const doc = new PDFDocument({
    margin: 25, // Slightly reduced margins to give more horizontal space
    bufferPages: true, // Buffer pages for more reliable PDF creation
    info: {
      Title: reportTitle,
      Author: "Attendance System",
      Subject: "Generated Report",
      Creator: "Time and Attendance Management System",
      Producer: "PDFKit",
    },
  });

  // Create write stream
  const stream = fs.createWriteStream(tempFilePath);
  doc.pipe(stream);

  // Add title
  const title = metadata.name
    ? `${reportTitle} - ${metadata.name}`
    : reportTitle;

  doc.fontSize(20).text(title, { align: "center" });
  doc.moveDown();

  // Add date range if provided
  if (metadata.startDate && metadata.endDate) {
    doc
      .fontSize(12)
      .text(`Period: ${metadata.startDate} to ${metadata.endDate}`, {
        align: "center",
      });
    doc.moveDown();
  }

  // Add timestamp
  doc
    .fontSize(10)
    .text(`Generated on: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}`, {
      align: "center",
    });
  doc.moveDown(2); // Determine table column widths based on content
  const pageWidth = doc.page.width - 2 * doc.page.margins.left;
  const columnWidths = [];
  const columnCount = headers.length; // Define minimum widths for specific columns that tend to have longer content
  const minColumnWidths = {
    email: 165, // Email addresses can be quite long
    leaveType: 100, // Leave types like "Compensatory Leave" need more space
    status: 70, // Status values are typically short
    reason: 130, // Reasons can be very long text
    appliedDate: 80, // Dates need consistent width
    startDate: 80,
    endDate: 80,
    checkIn: 90, // Check-in time space adjusted
    checkOut: 90, // Check-out time space adjusted
    date: 100, // Date field space adjusted
    duration: 60, // Numbers need less space
    employeeName: 150, // Employee name width adjusted
    employeeCode: 70, // Employee code width adjusted
    department: 100, // Department names can vary in length
    workHours: 60, // Work hours need less space
  };

  // Calculate average content length for each column
  const avgContentLength = fields.map((field, index) => {
    // Start with header length
    let maxLength = headers[index].length;

    // Check content length
    if (data.length > 0) {
      const contentLengths = data.map((item) =>
        item[field] !== undefined ? String(item[field]).length : 0
      );

      const avgLength =
        contentLengths.reduce((sum, len) => sum + len, 0) /
        contentLengths.length;
      maxLength = Math.max(maxLength, avgLength);
    }

    return maxLength;
  });

  // Calculate total of all lengths for proportion
  const totalLength = avgContentLength.reduce((sum, len) => sum + len, 0);

  // Assign proportional widths with minimums
  for (let i = 0; i < columnCount; i++) {
    const fieldName = fields[i];
    const proportion = avgContentLength[i] / totalLength;
    const calculatedWidth = pageWidth * proportion;
    const minWidth = minColumnWidths[fieldName] || 50; // Default minimum width of 50

    columnWidths[i] = Math.max(calculatedWidth, minWidth);
  } // Adjust if total width exceeds page width
  const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
  // Define custom padding between specific columns to control spacing
  const customColumnPadding = {
    date: 24, // Increased padding after date (before employee name)
    employeeName: 4, // Decreased padding after employee name (before employee code)
    employeeCode: 4, // Decreased padding after employee code (before email)
    email: 20, // Increased padding after email (before check in)
    checkIn: 4, // Decreased padding after check in (before check out)
  };

  // Add extra padding between columns to prevent overlapping
  let totalPadding = 0;
  for (let i = 0; i < columnCount; i++) {
    const fieldName = fields[i];
    totalPadding += customColumnPadding[fieldName] || 8; // Use custom padding or default 8px
  }

  const totalColumnsWithPadding = totalWidth + totalPadding;

  if (totalColumnsWithPadding > pageWidth) {
    // Identify critical columns that need to maintain their width
    const criticalColumns = [
      "employeeName",
      "email",
      "date",
      "checkIn",
      "checkOut",
    ];

    // Ensure table fits within page width with column separation
    const targetWidth = pageWidth - columnCount * 8; // Account for padding
    const excessWidth = totalWidth - targetWidth;

    // Two-pass approach:
    // 1. First try to reduce non-critical columns
    let adjustableColumns = [];
    let adjustableWidth = 0;

    for (let i = 0; i < columnCount; i++) {
      const fieldName = fields[i];
      if (!criticalColumns.includes(fieldName)) {
        adjustableColumns.push(i);
        adjustableWidth += columnWidths[i];
      }
    }

    // If we have enough adjustable width, reduce only non-critical columns
    if (adjustableColumns.length > 0 && adjustableWidth > excessWidth) {
      const reductionRatio = excessWidth / adjustableWidth;

      for (let i of adjustableColumns) {
        columnWidths[i] -= columnWidths[i] * reductionRatio;
        // Ensure each column still has a minimum width
        columnWidths[i] = Math.max(columnWidths[i], 40);
      }
    }
    // 2. If we still can't fit, use a more intelligent approach
    else {
      // Preserve minimum width for critical columns if possible
      const criticalMinWidths = {
        employeeName: 140,
        email: 150,
        date: 80,
        checkIn: 80,
        checkOut: 80,
      };

      // Calculate how much we can scale
      let remainingWidth = pageWidth - columnCount * 8; // Account for padding

      // First allocate minimum widths to critical columns
      for (let i = 0; i < columnCount; i++) {
        const fieldName = fields[i];
        if (criticalColumns.includes(fieldName)) {
          const minWidth = criticalMinWidths[fieldName];
          columnWidths[i] = minWidth;
          remainingWidth -= minWidth;
        }
      }

      // Then distribute remaining width proportionally to non-critical columns
      let totalNonCriticalWidth = 0;
      for (let i = 0; i < columnCount; i++) {
        if (!criticalColumns.includes(fields[i])) {
          totalNonCriticalWidth += columnWidths[i];
        }
      }

      if (totalNonCriticalWidth > 0) {
        const scaleFactor = remainingWidth / totalNonCriticalWidth;
        for (let i = 0; i < columnCount; i++) {
          if (!criticalColumns.includes(fields[i])) {
            columnWidths[i] *= scaleFactor;
            columnWidths[i] = Math.max(columnWidths[i], 35); // Minimum non-critical width
          }
        }
      }
    }
  }
  // Draw table header background
  doc.rect(doc.page.margins.left, doc.y - 5, pageWidth, 30).fill("#e5e7eb"); // Draw table headers with improved spacing
  let xPos = doc.page.margins.left + 5; // Add some padding
  doc.font("Helvetica-Bold");
  for (let i = 0; i < columnCount; i++) {
    // Add more padding between columns to prevent overlap
    const columnPadding = 4; // Base padding (4px on each side)
    const fieldName = fields[i];

    // Add additional right padding based on the field to control gaps between columns
    const rightPadding = customColumnPadding[fieldName]
      ? (customColumnPadding[fieldName] - 8) / 2
      : 0; // Adjust for the difference from default

    doc
      .fillColor("#1f2937")
      .fontSize(10)
      .text(headers[i], xPos + columnPadding, doc.y, {
        width: columnWidths[i] - columnPadding * 2 - rightPadding, // Account for custom spacing
        align: "left",
        baseline: "middle",
        lineBreak: false,
      });

    // Move to next column position with extra space between columns
    xPos += columnWidths[i];

    // Add custom spacing between columns
    if (i < columnCount - 1) {
      const extraPadding = customColumnPadding[fieldName] || 8;
      xPos += extraPadding - 8; // Add the difference from default
    }
  }

  doc.moveDown(1);
  doc.font("Helvetica");
  doc.fillColor("#000000");

  // Draw horizontal line
  doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.left, doc.y)
    .stroke("#64748b");

  doc.moveDown(0.5);

  // Draw table rows
  data.forEach((item, rowIndex) => {
    // Check if we need a new page
    if (doc.y > doc.page.height - 100) {
      doc.addPage(); // Draw table header background on new page
      doc
        .rect(doc.page.margins.left, doc.page.margins.top, pageWidth, 30)
        .fill("#e5e7eb");

      // Add headers on new page
      xPos = doc.page.margins.left + 5; // Add some padding
      doc.font("Helvetica-Bold");
      for (let i = 0; i < columnCount; i++) {
        const columnPadding = 4; // Keep consistent with header padding
        const fieldName = fields[i];

        // Apply the same custom padding logic
        const rightPadding = customColumnPadding[fieldName]
          ? (customColumnPadding[fieldName] - 8) / 2
          : 0;

        doc
          .fillColor("#1f2937")
          .fontSize(10)
          .text(headers[i], xPos + columnPadding, doc.page.margins.top + 10, {
            width: columnWidths[i] - columnPadding * 2 - rightPadding, // Account for custom spacing
            align: "left",
            baseline: "middle",
            lineBreak: false,
          });
        xPos += columnWidths[i];

        // Add custom spacing between columns
        if (i < columnCount - 1) {
          const extraPadding = customColumnPadding[fieldName] || 8;
          xPos += extraPadding - 8; // Add the difference from default
        }
      }

      doc.y = doc.page.margins.top + 30; // Move down after the header
      doc.font("Helvetica");
      doc.fillColor("#000000");

      // Draw horizontal line
      doc
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.left, doc.y)
        .stroke("#64748b");

      doc.moveDown(0.5);
    } // Draw row data
    const rowY = doc.y;
    let maxRowHeight = 0;
    xPos = doc.page.margins.left;

    // Add background for alternating rows first
    if (rowIndex % 2 === 1) {
      // Wait to determine the height until after we calculate it
      // We'll fill this rectangle after calculating the max height
    }
    for (let i = 0; i < columnCount; i++) {
      const cellValue =
        item[fields[i]] !== undefined ? String(item[fields[i]]) : "";
      const field = fields[i];

      // Use custom padding based on field type to control spacing between columns
      const columnPadding = 4; // Base padding (4px on each side)

      // Add additional right padding based on the field to control gaps between columns
      const rightPadding = customColumnPadding[field]
        ? (customColumnPadding[field] - 8) / 2
        : 0; // Adjust for the difference from default

      const cellOptions = {
        width: columnWidths[i] - columnPadding * 2 - rightPadding, // Account for padding on both sides
        align: "left",
        lineBreak: true, // Enable proper word wrapping
        ellipsis: false, // Default to no ellipsis to ensure text wraps properly
      };

      // Enhanced handling for specific field types
      if (field === "email") {
        // For emails: Format with word wrapping and handle long addresses
        cellOptions.width = Math.min(columnWidths[i] - columnPadding * 2, 160);

        // For long emails, try to break at @ symbol
        if (cellValue.length > 25 && cellValue.includes("@")) {
          const parts = cellValue.split("@");
          if (parts.length === 2) {
            // Don't modify the actual value, just display logic
            cellOptions.lineBreak = true;
          }
        }
      } else if (field === "employeeName") {
        // Ensure employee names have enough room and properly wrap if needed
        cellOptions.width = Math.min(columnWidths[i] - columnPadding * 2, 150);
        cellOptions.lineBreak = true;
      } else if (
        field === "date" ||
        field === "startDate" ||
        field === "endDate" ||
        field === "appliedDate"
      ) {
        // Left-align date values with consistent spacing
        cellOptions.align = "left";
      } else if (field === "checkIn" || field === "checkOut") {
        // Center-align time values
        cellOptions.align = "center";
      } else if (field === "reason" || field === "leaveType") {
        // These fields may contain long text, ensure they wrap properly
        cellOptions.ellipsis = false;
        cellOptions.lineBreak = true;
      } // Calculate height of this cell
      const cellHeight = doc.heightOfString(cellValue, cellOptions);
      maxRowHeight = Math.max(maxRowHeight, cellHeight);

      // Add padding to the left of each cell for better separation
      doc.fontSize(9).text(cellValue, xPos + columnPadding, rowY, cellOptions);

      // Move to next column position
      xPos += columnWidths[i];

      // Add custom spacing between columns
      if (i < columnCount - 1) {
        const extraPadding = customColumnPadding[field] || 8;
        xPos += extraPadding - 8; // Add the difference from default
      }
    }

    // Now we know the max height, add the background for alternating rows
    if (rowIndex % 2 === 1) {
      doc
        .rect(doc.page.margins.left, rowY - 2, pageWidth, maxRowHeight + 4)
        .fillAndStroke("#f5f5f5", null); // Redraw the text since it might have been covered by the background
      xPos = doc.page.margins.left;
      for (let i = 0; i < columnCount; i++) {
        const cellValue =
          item[fields[i]] !== undefined ? String(item[fields[i]]) : "";
        const field = fields[i];

        // Use the same padding and options as in the first pass
        const columnPadding = 4;

        // Apply the same custom padding logic
        const rightPadding = customColumnPadding[field]
          ? (customColumnPadding[field] - 8) / 2
          : 0; // Adjust for the difference from default

        const cellOptions = {
          width: columnWidths[i] - columnPadding * 2 - rightPadding,
          align: "left",
          lineBreak: true,
        };

        // Apply the same formatting based on field type
        if (field === "email") {
          cellOptions.width = Math.min(
            columnWidths[i] - columnPadding * 2,
            160
          );
        } else if (field === "employeeName") {
          cellOptions.width = Math.min(
            columnWidths[i] - columnPadding * 2,
            150
          );
        } else if (
          field === "date" ||
          field === "startDate" ||
          field === "endDate" ||
          field === "appliedDate"
        ) {
          cellOptions.align = "left";
        } else if (field === "checkIn" || field === "checkOut") {
          cellOptions.align = "center";
        }
        doc
          .fontSize(9)
          .text(cellValue, xPos + columnPadding, rowY, cellOptions);
        xPos += columnWidths[i];

        // Add custom spacing between columns
        if (i < columnCount - 1) {
          const extraPadding = customColumnPadding[field] || 8;
          xPos += extraPadding - 8; // Add the difference from default
        }
      }
    }
    // Update Y position for next row with a consistent padding between rows
    doc.y = rowY + maxRowHeight + 8;
  });

  // Add page numbers
  const pageCount = doc.pageCount;
  for (let i = 1; i <= pageCount; i++) {
    doc.switchToPage(i - 1);
    doc
      .fontSize(8)
      .text(
        `Page ${i} of ${pageCount}`,
        doc.page.margins.left,
        doc.page.height - 20,
        { align: "center" }
      );
  }

  // Finalize PDF and end stream
  doc.end();

  // Wait for file to be written
  return new Promise((resolve, reject) => {
    // Wait for the PDF to finish being written to disk
    stream.on("finish", () => {
      try {
        // Clear any existing headers to prevent conflicts
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${reportTitle.replace(/\s+/g, "_")}.pdf"`
        );
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

        // Read the file from disk
        const fileContent = fs.readFileSync(tempFilePath);

        // Send the file as a buffer to avoid streaming issues
        res.send(fileContent);

        // Delete temp file after sending
        fs.unlink(tempFilePath, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });

        resolve();
      } catch (error) {
        console.error("Error sending PDF:", error);
        reject(error);
      }
    });

    stream.on("error", (err) => {
      console.error("Stream error:", err);
      reject(err);
    });
  });
};
