export interface User {
  _id: string;
  username: string;
  email: string;
  full_name: string;
  roles: string[];
  join_date?: string;
  contact_number?: string;
  is_active?: boolean;
}

export interface AuthResponse extends Omit<User, 'roles'> {
  token: string;
  roles: string[];
}

export interface AdminStats {
  users: number;
  employees: number;
  departments: number;
  attendance: {
    total: number;
    present: number;
    absent: number;
    onLeave: number;
  };
  pendingLeaveRequests: number;
  departmentStats: Array<{
    department: string;
    employeeCount: number;
  }>;
} 