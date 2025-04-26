# Attendance Management System

A full-stack web application for managing employee attendance, leave requests, and administrative tasks.

## Features

- User authentication with role-based access control
- Employee profile management
- Attendance tracking
- Leave request system with approval workflow
- Admin dashboard with stats and reports
- Department management

## Project Structure

```
/
├── backend/                     # Backend code (Express.js, MongoDB)
│   ├── src/                     # Source code
│   ├── scripts/                 # Setup and utility scripts
│   └── ...                      # Configuration files
│
├── frontend/                    # Frontend code (React, TypeScript)
│   ├── src/                     # Source code
│   ├── public/                  # Static assets
│   └── ...                      # Configuration files
```

## Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

## Setup Instructions

1. **Clone the repository**

```bash
git clone <repository-url>
cd attendance-management-system
```

2. **Install dependencies**

```bash
npm run install:all
```

3. **Configure environment variables**

Create a `.env` file in the backend directory based on `example.env`

```bash
# Example minimal configuration
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/attendance_system
JWT_SECRET=your_secret_key
```

4. **Run the setup script**

```bash
npm run setup
```

5. **Start the development server**

```bash
npm run dev
```

This will start both the backend server and frontend development server.

- Backend: http://localhost:5000
- Frontend: http://localhost:5173

## Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build the frontend for production
- `npm run start` - Start the production server
- `npm run setup` - Run initial setup scripts

## License

ISC
