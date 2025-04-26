# Attendance Management System

A full-stack web application for managing employee attendance, leave requests, and administrative tasks.

## Features

- User authentication with role-based access control
- Employee profile management
- Attendance tracking with clock-in and clock-out
- Leave request management system with approval workflow
- Admin dashboard with analytics and reports
- Department and role management
- MongoDB database for data storage

## Project Structure

```
/
├── backend/                     # Backend code (Express.js, MongoDB)
│   ├── src/                     # Source code
│   │   ├── controllers/         # Request handlers
│   │   ├── middleware/          # Express middleware
│   │   ├── models/              # MongoDB models
│   │   ├── routes/              # API routes
│   │   ├── utils/               # Utility functions
│   │   ├── validations/         # Zod validation schemas
│   │   ├── app.js               # Express app setup
│   │   └── server.js            # Server entry point
│   ├── scripts/                 # Setup and utility scripts
│   └── .env                     # Environment variables
│
├── frontend/                    # Frontend code (React, TypeScript)
│   ├── src/                     # Source code
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Page components
│   │   ├── store/               # State management
│   │   └── App.tsx              # Main component
│   ├── public/                  # Static assets
│   └── ...                      # Configuration files
├── .env                         # Root environment variables
└── package.json                 # Project scripts and dependencies
```

## Prerequisites

- Node.js (v16+)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

## Step-by-Step Setup Guide

Follow these steps in order when setting up the application for the first time:

1. **Clone the repository**

```bash
git clone https://github.com/your-username/attendance-management-system.git
cd attendance-management-system
```

2. **Install all dependencies**

```bash
npm run install:all
```

This will install dependencies for the root project, frontend, and backend.

3. **Configure environment variables**

You need to create two .env files - one in the root directory and one in the backend directory.

First, create a .env file in the root directory:

```bash
# For Windows PowerShell
echo "# Server Configuration`nPORT=5003`nNODE_ENV=development`nMONGO_URI=mongodb+srv://wasif:XxnpBQREVtaJ61mb@cluster0.kvxrr.mongodb.net/Test_attendance_system`nJWT_SECRET=supersecretjwttokenforthisattendancesystemproject`nJWT_EXPIRE=30d" > .env
```

Then, create a .env file in the backend directory with the same content:

```bash
# For Windows PowerShell
cd backend
echo "PORT=5003`nNODE_ENV=development`nMONGO_URI=mongodb+srv://wasif:XxnpBQREVtaJ61mb@cluster0.kvxrr.mongodb.net/Test_attendance_system`nJWT_SECRET=supersecretjwttokenforthisattendancesystemproject`nJWT_EXPIRE=30d" > .env
cd ..
```

> **Important Note**: The sample MongoDB URI is provided only for demonstration. You should replace it with your own MongoDB connection string.

4. **Run database initialization scripts**

Run the setup script to initialize the database:

```bash
cd backend
npm run setup
cd ..
```

This script performs the following actions:

- Creates default user roles (ADMIN, MANAGER, EMPLOYEE)
- Sets up leave types with default quotas
- Initializes the database schema

5. **Start the servers**

Start the backend server first:

```bash
cd backend
npm run dev
```

Open a new terminal and start the frontend server:

```bash
cd frontend
npm run dev
```

Alternatively, from the root directory, you can use:

```bash
npm run dev:backend  # For backend server
npm run dev:frontend # For frontend server
```

6. **Create an admin user**

Access the registration page at http://localhost:5173/register to create your first user.

7. **Access the application**

- Frontend: http://localhost:5173
- Backend API: http://localhost:5003

## Running the Application (After Setup)

After initial setup, you can start the application by running these commands in separate terminals:

For backend:

```bash
cd backend
npm run dev
```

For frontend:

```bash
cd frontend
npm run dev
```

## Available Scripts

- `npm run dev` - Start both frontend and backend in development mode (may require separate terminals on Windows)
- `npm run dev:backend` - Start only the backend server
- `npm run dev:frontend` - Start only the frontend development server
- `npm run build` - Build the frontend for production
- `npm run setup` - Run initial database setup scripts
- `npm run seed:roles` - Seed the default user roles
- `npm run seed:leaves` - Seed the default leave types
- `npm run install:all` - Install dependencies for all packages

## Backend API Endpoints

- Auth: `/api/auth` - Authentication endpoints
- Employees: `/api/employees` - Employee management
- Attendance: `/api/attendance` - Attendance tracking
- Leaves: `/api/leaves` - Leave request management
- Departments: `/api/departments` - Department management
- Admin: `/api/admin` - Admin operations
- Roles: `/api/roles` - Role management

## Troubleshooting

### PowerShell Command Syntax

If you're using Windows PowerShell, remember that it uses semicolons (;) instead of ampersands (&&) for command chaining:

```powershell
# Correct way in PowerShell
cd backend; npm run dev

# Incorrect in PowerShell
cd backend && npm run dev  # This will give an error
```

### Port Conflicts

If you encounter port conflicts (EADDRINUSE error), check if any processes are using the specified ports:

```powershell
# Check for processes using port 5003
netstat -ano | findstr :5003
```

Kill the process using the identified PID:

```powershell
taskkill /F /PID <PID>
```

### MongoDB Connection Issues

If you encounter MongoDB connection errors:

1. Verify your MongoDB connection string in both .env files
2. Ensure you have network connectivity to the MongoDB server
3. Check that the database user has appropriate permissions

### Missing Dependencies

If you encounter missing package errors, run `npm run install:all` again, or install the specific packages:

```bash
cd backend
npm install dotenv mongoose colors
```

## License

ISC
