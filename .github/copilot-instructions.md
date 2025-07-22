# Attendance Management System - AI Agent Instructions

## Architecture Overview

This is a full-stack attendance management system with:

- **Backend**: Node.js/Express with MongoDB, JWT auth, role-based access control
- **Frontend**: React/TypeScript with Vite, Zustand state management, TailwindCSS
- **Data Flow**: RESTful API with Axios interceptors for auth token management

## Critical Development Workflows

### Setup & Development

```bash
# Initial setup (runs database initialization)
npm run install:all && npm run setup

# Development (runs both frontend and backend)
npm run dev

# Backend only: cd backend && npm run dev (port 5003)
# Frontend only: cd frontend && npm run dev (port 5173)
```

### Database Initialization

- `npm run setup` runs `scripts/initDb.js` and `scripts/addLeaveTypes.js`
- Creates default roles (ADMIN, MANAGER, EMPLOYEE) and leave types
- Use `backend/scripts/` utilities for database operations and testing

## Authentication & Authorization Patterns

### Role-Based Access Control

- **Models**: User → UserRole ← Role (many-to-many relationship)
- **Middleware**: `protect` (auth) → `admin`/`manager`/`departmentManager` (role-based)
- **Frontend**: `useAuthStore` with `isAdmin`, `isManager` computed from roles array

### JWT Token Flow

- Backend: `config/jwt.js` for token generation/verification
- Frontend: Axios interceptors auto-add `Bearer` tokens from Zustand `auth-storage`
- Token stored in localStorage, automatically attached to all API calls

## API Conventions

### Backend Routes Structure

```
/api/auth/*        - Authentication (login, register)
/api/user/*        - User profile management
/api/employees/*   - Employee CRUD (admin/manager)
/api/attendance/*  - Clock in/out, attendance logs
/api/leaves/*      - Leave requests and approvals
/api/notifications/* - System notifications
```

### Frontend API Calls

- **Base URL**: `http://localhost:5003/api` (configured in `src/api/axios.ts`)
- **Pattern**: Use `/user/profile` NOT `/api/user/profile` (base URL includes /api)
- **Structure**: Separate files per domain (`api/auth.ts`, `api/attendance.ts`, etc.)

## Data Validation Patterns

### Backend Validation

- **Zod schemas** in `validations/` directory (authValidation.js, leaveValidation.js, etc.)
- **Middleware**: `validationMiddleware.js` processes Zod schemas
- **Pattern**: Export named schemas, import in controllers

### Database Models

- **Mongoose** with timestamp support and custom methods
- **Key Models**: User (auth), Employee (profiles), Attendance, LeaveRequest, Notification
- **Relationships**: User ↔ Employee (1:1), User ↔ UserRole ↔ Role (M:N)

## State Management (Frontend)

### Zustand Stores

- **authStore**: User auth, roles, token management with persistence
- **Pattern**: Actions return void, handle errors within store methods
- **Persistence**: Uses `zustand/middleware` persist for localStorage sync

### Component Patterns

- **Route Protection**: `ProtectedRoute` and `AdminRoute` wrapper components
- **Role Checking**: Computed properties in authStore (`isAdmin`, `isManager`)
- **API Integration**: React Query (`@tanstack/react-query`) for server state

## Key Integration Points

### Frontend-Backend Communication

- **CORS**: Configured for `localhost:3000` and `localhost:5173`
- **Error Handling**: Axios interceptors log all requests/responses
- **Debug Endpoints**: `/api/debug` and `/api/debug/auth` for API verification

### Development Utilities

- **Scripts Directory**: Database seeding, user creation, cleanup utilities
- **Environment**: Dual .env files (root and backend/) with same content
- **Logging**: Console logging with colors package, Morgan for HTTP requests

## Project-Specific Conventions

- **File Structure**: Separate backend/frontend with shared package.json scripts
- **ES Modules**: Backend uses `"type": "module"` - use import/export syntax
- **Port Convention**: Backend on 5003 (not 5002 to avoid conflicts)
- **Error Handling**: Express async handler with custom error middleware
- **TypeScript**: Frontend only, strict type checking with Zod schemas

## Common Debugging Commands

```bash
# Check database connection and test users
cd backend && node scripts/testNotifications.js

# List all admin users
cd backend && node scripts/listAdminUsers.js

# Fix user roles or leave balances
cd backend && node scripts/fixUserRole.js
cd backend && node scripts/fixLeaveBalances.js
```
