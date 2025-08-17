import api from './axios';

export interface Department {
  _id: string;
  dept_name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  location?: string;
  budget?: number;
  employee_count: number;
  dept_head_id?: {
    _id: string;
    employee_code: string;
    user_id: {
      full_name: string;
      email: string;
    };
  };
  employees?: Employee[];
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  _id: string;
  employee_code: string;
  position?: string;
  salary?: number;
  user_id: {
    full_name: string;
    email: string;
    contact_number?: string;
  };
}

export interface CreateDepartmentData {
  dept_name: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  location?: string;
  budget?: number;
}

export interface UpdateDepartmentData extends Partial<CreateDepartmentData> {}

export interface DepartmentStats {
  totalDepartments: number;
  activeDepartments: number;
  inactiveDepartments: number;
  departmentsWithHeads: number;
  departmentDistribution: {
    _id: string;
    dept_name: string;
    status: string;
    employee_count: number;
  }[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface DepartmentListResponse {
  success: boolean;
  departments: Department[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalDepartments: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class DepartmentAPI {
  // Get department statistics
  static async getStats(): Promise<DepartmentStats> {
    const response = await api.get('/departments/stats');
    return response.data.stats;
  }

  // Get all departments with pagination and search
  static async getAll(params: PaginationParams = {}): Promise<DepartmentListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.order) queryParams.append('order', params.order);

    const response = await api.get(`/departments?${queryParams.toString()}`);
    return response.data;
  }

  // Get department by ID
  static async getById(id: string): Promise<Department> {
    const response = await api.get(`/departments/${id}`);
    return response.data.department;
  }

  // Create new department
  static async create(data: CreateDepartmentData): Promise<Department> {
    const response = await api.post('/departments', data);
    return response.data.department;
  }

  // Update department
  static async update(id: string, data: UpdateDepartmentData): Promise<Department> {
    const response = await api.put(`/departments/${id}`, data);
    return response.data.department;
  }

  // Delete department
  static async delete(id: string): Promise<void> {
    await api.delete(`/departments/${id}`);
  }

  // Assign department head
  static async assignHead(departmentId: string, employeeId: string): Promise<Department> {
    const response = await api.put(`/departments/${departmentId}/head`, {
      dept_head_id: employeeId
    });
    return response.data.department;
  }

  // Remove department head
  static async removeHead(departmentId: string): Promise<Department> {
    const response = await api.delete(`/departments/${departmentId}/head`);
    return response.data.department;
  }

  // Get available employees for department head assignment
  static async getAvailableHeads(departmentId: string): Promise<Employee[]> {
    const response = await api.get(`/departments/${departmentId}/available-heads`);
    return response.data.employees;
  }
}

export default DepartmentAPI;
