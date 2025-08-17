# Enhanced Department Management System

## Overview

The department management system has been significantly enhanced to provide administrators with comprehensive tools to create, manage, and organize departments within the attendance system.

## Features

### 1. Complete CRUD Operations

- **Create Department**: Add new departments with detailed information
- **Read Departments**: List all departments with pagination and search
- **Update Department**: Modify existing department details
- **Delete Department**: Remove departments (with safety checks)

### 2. Advanced Department Information

Each department now includes:

- **Basic Info**: Name, description
- **Status**: ACTIVE/INACTIVE status tracking
- **Location**: Physical location of the department
- **Budget**: Department budget tracking
- **Employee Count**: Automatic tracking of assigned employees
- **Department Head**: Assign managers as department heads

### 3. Enhanced Query Features

- **Pagination**: Efficient handling of large department lists
- **Search**: Search departments by name or description
- **Filtering**: Filter by status (active/inactive)
- **Sorting**: Sort by various fields (name, employee count, etc.)

### 4. Department Head Management

- **Assign Head**: Set an employee as department head
- **Remove Head**: Remove department head assignment
- **Available Candidates**: List employees eligible to be department heads

### 5. Statistics and Analytics

- Total departments count
- Active/Inactive department breakdown
- Departments with/without heads
- Employee distribution across departments

## API Endpoints

### Department CRUD

```
GET    /api/departments              - List all departments (with pagination/search)
POST   /api/departments              - Create new department
GET    /api/departments/:id          - Get department details
PUT    /api/departments/:id          - Update department
DELETE /api/departments/:id          - Delete department
```

### Department Management

```
GET    /api/departments/stats        - Get department statistics
GET    /api/departments/:id/available-heads  - Get employees available for head assignment
PUT    /api/departments/:id/head     - Assign department head
DELETE /api/departments/:id/head     - Remove department head
```

### Query Parameters for GET /api/departments

- `page` (number): Page number for pagination (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search term for name/description
- `status` (string): Filter by status (ACTIVE/INACTIVE)
- `sort` (string): Sort field (dept_name, employee_count, etc.)
- `order` (string): Sort order (asc/desc, default: asc)

## Request/Response Examples

### Create Department

```json
POST /api/departments
{
  "dept_name": "Information Technology",
  "description": "Handles all IT operations and support",
  "status": "ACTIVE",
  "location": "Building A, Floor 3",
  "budget": 150000
}

Response:
{
  "success": true,
  "message": "Department created successfully",
  "department": {
    "_id": "...",
    "dept_name": "Information Technology",
    "description": "Handles all IT operations and support",
    "status": "ACTIVE",
    "location": "Building A, Floor 3",
    "budget": 150000,
    "employee_count": 0,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Get All Departments with Pagination

```json
GET /api/departments?page=1&limit=5&search=IT&status=ACTIVE

Response:
{
  "success": true,
  "departments": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalDepartments": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Get Department Details

```json
GET /api/departments/:id

Response:
{
  "success": true,
  "department": {
    "_id": "...",
    "dept_name": "Information Technology",
    "description": "Handles all IT operations and support",
    "status": "ACTIVE",
    "location": "Building A, Floor 3",
    "budget": 150000,
    "employee_count": 5,
    "dept_head_id": {
      "_id": "...",
      "employee_code": "EMP001",
      "user_id": {
        "full_name": "John Smith",
        "email": "john.smith@company.com"
      }
    },
    "employees": [
      {
        "_id": "...",
        "employee_code": "EMP001",
        "user_id": {
          "full_name": "John Smith",
          "email": "john.smith@company.com",
          "contact_number": "+1234567890"
        },
        "position": "IT Manager",
        "salary": 75000
      }
    ]
  }
}
```

### Assign Department Head

```json
PUT /api/departments/:id/head
{
  "dept_head_id": "employee_object_id"
}

Response:
{
  "success": true,
  "message": "Department head assigned successfully",
  "department": {
    "_id": "...",
    "dept_name": "Information Technology",
    "dept_head_id": {
      "_id": "...",
      "employee_code": "EMP001",
      "user_id": {
        "full_name": "John Smith",
        "email": "john.smith@company.com"
      }
    }
  }
}
```

### Department Statistics

```json
GET /api/departments/stats

Response:
{
  "success": true,
  "stats": {
    "totalDepartments": 8,
    "activeDepartments": 7,
    "inactiveDepartments": 1,
    "departmentsWithHeads": 5,
    "departmentDistribution": [
      {
        "_id": "...",
        "dept_name": "Information Technology",
        "status": "ACTIVE",
        "employee_count": 12
      },
      {
        "_id": "...",
        "dept_name": "Human Resources",
        "status": "ACTIVE",
        "employee_count": 8
      }
    ]
  }
}
```

## Validation Rules

### Create Department

- `dept_name`: Required, string, 2-100 characters, unique
- `description`: Optional, string, max 500 characters
- `status`: Optional, enum ["ACTIVE", "INACTIVE"], defaults to "ACTIVE"
- `location`: Optional, string, max 200 characters
- `budget`: Optional, number, min 0

### Update Department

- All fields optional except validation rules apply when provided
- Cannot change dept_name to duplicate existing name

### Assign Department Head

- `dept_head_id`: Required, valid ObjectId of existing employee
- Employee must belong to the department being assigned to

## Safety Features

### Delete Protection

- Cannot delete department if employees are assigned
- Provides count of assigned employees in error message
- Suggests reassigning employees before deletion

### Data Integrity

- Automatic employee count updates
- Cascade delete prevention for orphaned records
- Referential integrity checks for department head assignments

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [...] // Validation errors if applicable
}
```

Common HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

## Permissions

### Admin Only Operations

- Create department
- Update department
- Delete department
- Assign/remove department head
- View department statistics

### General Access

- View all departments (filtered based on user role)
- View specific department details

## Database Schema

```javascript
// Department Model
{
  dept_name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  },
  location: {
    type: String,
    trim: true
  },
  budget: {
    type: Number,
    min: 0
  },
  employee_count: {
    type: Number,
    default: 0
  },
  dept_head_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  timestamps: true
}
```

## Testing

Use the provided test script `testDepartmentManagement.js` to verify all functionality:

```bash
node testDepartmentManagement.js
```

Remember to:

1. Update the ADMIN_TOKEN in the test script
2. Ensure the backend server is running
3. Have valid test data in the database

## Integration Notes

### Frontend Integration

- All endpoints return consistent JSON responses
- Pagination data included for list operations
- Detailed error messages for user feedback
- Success/failure status clearly indicated

### Future Enhancements

- Department budget tracking over time
- Advanced analytics and reporting
- Bulk operations (import/export departments)
- Department hierarchy support
- Integration with payroll systems

This enhanced department management system provides a solid foundation for comprehensive organizational structure management within the attendance system.
