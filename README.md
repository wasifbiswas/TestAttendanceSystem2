# Employee Attendance Management System API

A comprehensive backend API for managing employee attendance, leave requests, departments, and user roles built with Node.js, Express.js, MongoDB, and JWT authentication.

## Quick Start

1. **Clone and Install**

   ```
   git clone https://github.com/wasifbiswas/TestAttendanceSystem2
   cd TestAttendanceSystem2
   npm install
   ```

2. **Configure Environment**

   - Create a `.env` file in the root directory:

   ```
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=30d
   NODE_ENV=development
   ```

3. **Setup Application**

   ```
   npm run setup   # Initializes roles and leave types
   ```

4. **Start the Server**
   ```
   npm run dev     # Development mode
   npm start       # Production mode
   ```

## Project Structure

```
attendance-system-backend/
├── src/                      # Source code
│   ├── config/               # Configuration files
│   ├── controllers/          # API controllers
│   ├── middleware/           # Express middleware
│   ├── models/               # Mongoose models
│   ├── routes/               # API routes
│   ├── services/             # Business logic services
│   ├── utils/                # Utility functions
│   ├── validations/          # Input validation schemas
│   ├── app.js                # Express application setup
│   └── server.js             # Server initialization
├── scripts/                  # Utility scripts
│   ├── initDb.js             # Database initialization
│   ├── addLeaveTypes.js      # Leave types setup
│   └── setup.js              # Combined setup script
├── tests/                    # Test files
│   ├── test.js               # Core functionality tests
│   └── testLeaves.js         # Leave management tests
├── .env                      # Environment variables (not in repo)
├── example.env               # Example environment file
├── .gitignore                # Git ignore configuration
├── package.json              # Project dependencies and scripts
└── README.md                 # Project documentation
```

## Key Features

- **User Authentication** - JWT-based with role management (Admin, Manager, Employee)
- **Employee Management** - Create, update, search and assign to departments
- **Attendance Tracking** - Check-in/out, work hours calculation
- **Leave Management** - 12 leave types with request/approval workflow
- **Department Management** - Create departments with heads, statistics
- **Admin Dashboard** - User management, statistics, access control

## Testing the Application

### Step-by-Step Testing Process

Follow these steps in order to fully test the attendance management system:

#### 1. Environment Setup

1. Make sure no existing Node.js processes are running to avoid port conflicts:

   ```
   # Windows
   taskkill /F /IM node.exe

   # macOS/Linux
   killall node
   ```

2. Create or update your `.env` file with the following configuration:

   ```
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=30d
   NODE_ENV=development
   ```

3. Initialize the database (only needed once or when resetting):
   ```
   npm run setup
   ```
   This command will:
   - Initialize user roles (Admin, Manager, Employee)
   - Add 12 types of leave with appropriate quotas
   - Assign the ADMIN role to the test user

#### 2. Start the Server

1. Start the application server in development mode:

   ```
   npm run dev
   ```

2. Verify the server is running by checking the console output:
   - You should see `Server running in development mode on port 5000`
   - You should see `MongoDB Connected: [connection-string]`

#### 3. Run Core Functionality Tests

1. In a new terminal window (keep the server running), run:

   ```
   npm test
   ```

   or directly:

   ```
   node tests/test.js
   ```

2. Observe the test results. The test performs these operations sequentially:

   - User registration (will show "User already exists" if previously created)
   - User login and JWT token retrieval
   - Accessing user profile information
   - Admin role verification
   - Department creation and listing
   - Employee creation and listing
   - Attendance check-in and check-out
   - Leave request creation
   - Leave listing and management
   - Admin statistics dashboard

3. Verify all tests pass with appropriate status codes (200/201/400 as expected)

#### 4. Run Leave Management Tests

1. In the terminal, run the specialized leave management tests:

   ```
   node tests/testLeaves.js
   ```

2. This test specifically validates:
   - Creation of various types of leave requests
   - Leave approval workflow
   - Leave rejection workflow
   - Leave balance management
   - Validation rules for leave requests

#### 5. Manual API Testing (Optional)

For developers who want to test specific endpoints manually, you can use:

##### Using REST Client in VS Code

1. Install REST Client extension in VS Code
2. Create a new file named `api-tests.http` in your project root
3. Add the following sample requests (replace placeholder values as needed):

```http
@baseUrl = http://localhost:5000/api
@authToken = YOUR_TOKEN_AFTER_LOGIN

### Register User
POST {{baseUrl}}/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "testuser@example.com",
  "password": "password123",
  "full_name": "Test User"
}

### Login
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}

### Get User Profile
GET {{baseUrl}}/auth/profile
Authorization: Bearer {{authToken}}

### Create Department (Admin only)
POST {{baseUrl}}/departments
Content-Type: application/json
Authorization: Bearer {{authToken}}

{
  "dept_name": "Engineering",
  "description": "Software Engineering Department"
}

### Create Employee (Admin only)
POST {{baseUrl}}/employees
Content-Type: application/json
Authorization: Bearer {{authToken}}

{
  "user_id": "USER_ID_HERE",
  "dept_id": "DEPARTMENT_ID_HERE",
  "designation": "Software Engineer",
  "hire_date": "2025-04-01T00:00:00.000Z",
  "employee_code": "EMP001"
}

### Attendance Check-in
POST {{baseUrl}}/attendance/check-in
Content-Type: application/json
Authorization: Bearer {{authToken}}

{
  "emp_id": "EMPLOYEE_ID_HERE",
  "remarks": "On time"
}

### Create Leave Request
POST {{baseUrl}}/leaves
Content-Type: application/json
Authorization: Bearer {{authToken}}

{
  "emp_id": "EMPLOYEE_ID_HERE",
  "leave_type_id": "LEAVE_TYPE_ID_HERE",
  "start_date": "2025-04-10T00:00:00.000Z",
  "end_date": "2025-04-12T00:00:00.000Z",
  "reason": "Vacation",
  "is_half_day": false
}
```

4. Run each request by clicking "Send Request" above each definition
5. For authenticated requests, first run the login request, then copy the token value and update the `@authToken` variable

##### Using Thunder Client in VS Code

1. Install Thunder Client extension
2. Create a new collection named "Attendance System API"
3. Define environment variables for tokens and IDs
4. Create requests for each endpoint following the same pattern as above
5. Run requests in sequence: Auth → Departments → Employees → Attendance → Leaves

### Troubleshooting Common Test Issues

If you encounter issues during testing:

1. **Server Connection Issues**

   - Verify the server is running in a separate terminal
   - Check for errors in the server console
   - Ensure MongoDB connection is successful

2. **Authentication Failures**

   - Ensure you're using the correct token in requests
   - Verify the token hasn't expired
   - Confirm user has appropriate roles for admin operations

3. **Role-Based Access Failures**

   - Run the setup script to ensure roles exist: `npm run setup`
   - Verify the user has the ADMIN role assigned

4. **Data Dependencies**

   - Tests depend on sequential operations
   - If a test fails, later tests may also fail due to missing data
   - Check error messages for specific missing IDs

5. **Database Reset**
   If tests are failing repeatedly and you want to start fresh:
   - Stop the server
   - Run `npm run setup` to reinitialize the database
   - Restart the server with `npm run dev`
   - Run tests again with `npm test`

### Automated Testing

1. **Prerequisites**

   - Server must be running: `npm run dev`
   - Database must be initialized: `npm run setup`

2. **Core Functionality Test**

   ```
   node tests/test.js
   ```

   - Tests: Authentication, roles, departments, employees, attendance, leave requests
   - Output shows status codes and response data for each API call

3. **Leave Management Test**

   ```
   node tests/testLeaves.js
   ```

   - Tests: Leave types, requests, approvals, rejections, balances

4. **Understanding Test Results**

   - **Success**: Status codes 200/201 with expected data
   - **Expected Failure**: Status codes 400/403/404 for validation cases
   - **Test Error**: Error message with stack trace

5. **Troubleshooting Tests**

   - Ensure server is running in another terminal
   - Check MongoDB connection
   - Verify roles are initialized
   - Kill other Node.js processes if port conflicts occur:

     ```
     # Windows
     taskkill /F /IM node.exe

     # macOS/Linux
     killall node
     ```

### Manual Testing in VS Code

1. **Using REST Client Extension**

   - Create `api-tests.http` file in project root
   - Add sample requests with proper headers and body
   - Run requests sequentially, copying tokens between requests

2. **Using Thunder Client Extension**

   - Create a collection for API requests
   - Set environment variables to store tokens
   - Group requests by functionality

3. **Common Test Scenarios**
   - User registration/login flow
   - Department and employee creation
   - Attendance check-in/out
   - Leave request creation and approval

## API Endpoints

- **Auth**: `/api/auth` - Register, login, profile
- **Employees**: `/api/employees` - CRUD operations
- **Attendance**: `/api/attendance` - Check-in, check-out, history
- **Leaves**: `/api/leaves` - Request, approve, reject
- **Departments**: `/api/departments` - Create, list, update
- **Admin**: `/api/admin` - Statistics, user management
- **Roles**: `/api/roles` - Role management

## Tech Stack

- Node.js and Express.js
- MongoDB with Mongoose
- JWT for authentication
- Zod for validation
- Morgan for logging
- Moment.js for date handling

## License

This project is licensed under the ISC License.
