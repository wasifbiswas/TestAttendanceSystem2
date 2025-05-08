import { useState, useEffect } from 'react';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { getRoles, makeUserAdmin, getAllDepartments } from '../api/admin';
// Import eye icons for password toggle
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
// Import axios instance
import api from '../api/axios';

// Form schema validation
const userSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  department: z.string().min(1, 'Please select a department'),
  gender: z.string().min(1, 'Please select a gender'),
  makeAdmin: z.boolean().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

// API function to create a user - updated to use axios instance and correct endpoint
const createUser = async (userData: any) => {
  try {
    // Using auth/register endpoint which is the correct endpoint for user creation
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error: any) {
    // Extract more detailed error message if available
    const errorMessage = error.response?.data?.message || 'Failed to create user';
    console.error('User creation error:', errorMessage);
    throw new Error(errorMessage);
  }
};

interface CreateUserFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface Department {
  _id: string;
  dept_name: string;
  description: string;
}

const CreateUserForm = ({ onSuccess, onCancel }: CreateUserFormProps) => {
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    fullName: '',
    department: '',
    gender: '',
    makeAdmin: false,
  });
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Fetch departments when component mounts
  useEffect(() => {
    const fetchDepartments = async () => {
      setIsLoading(true);
      try {
        const departmentsData = await getAllDepartments();
        setDepartments(departmentsData);
      } catch (error) {
        console.error('Error fetching departments:', error);
        setSubmitError('Failed to load departments. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear field error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    try {
      userSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Create the user
      const { username, email, password, fullName, department, gender, makeAdmin } = formData;

      // Find the selected department to get its name
      const selectedDept = departments.find(dept => dept._id === department);
      
      if (!selectedDept) {
        throw new Error("Selected department not found. Please try again.");
      }
      
      console.log(`Creating user with department ID: ${department}, name: ${selectedDept.dept_name}`);
      
      const userData = { 
        username, 
        email, 
        password, 
        full_name: fullName,
        // The backend expects 'department' to be the department name, not the ID
        department: selectedDept.dept_name,
        // Include department_id for compatibility with other APIs
        department_id: department,
        gender // Adding gender field to user creation
      };
      
      // Log the complete data being sent to the server for debugging
      console.log("Sending user data to server:", userData);
      
      const newUser = await createUser(userData);
      console.log('User created:', newUser);
      
      // If makeAdmin is checked, assign admin role
      if (makeAdmin) {
        // Get admin role ID
        const roles = await getRoles();
        const adminRole = roles.find(role => role.role_name === 'ADMIN');
        
        if (adminRole) {
          await makeUserAdmin(newUser._id, adminRole._id);
        }
      }
      
      onSuccess();
    } catch (error: any) {
      console.error('Error creating user:', error);
      // Display more specific error message if available
      setSubmitError(error.message || 'Failed to create user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
    >
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Create New User</h2>
      
      {submitError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md">
          {submitError}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:outline-none
                ${errors.username 
                  ? 'border-red-300 focus:ring-red-200 dark:border-red-700' 
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-200 dark:focus:ring-blue-900/30'
                } 
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              disabled={isSubmitting}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:outline-none
                ${errors.email 
                  ? 'border-red-300 focus:ring-red-200 dark:border-red-700' 
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-200 dark:focus:ring-blue-900/30'
                }
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:outline-none
                  ${errors.password 
                    ? 'border-red-300 focus:ring-red-200 dark:border-red-700' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-200 dark:focus:ring-blue-900/30'
                  }
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:outline-none
                ${errors.fullName 
                  ? 'border-red-300 focus:ring-red-200 dark:border-red-700' 
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-200 dark:focus:ring-blue-900/30'
                }
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              disabled={isSubmitting}
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fullName}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Department
            </label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:outline-none
                ${errors.department 
                  ? 'border-red-300 focus:ring-red-200 dark:border-red-700' 
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-200 dark:focus:ring-blue-900/30'
                }
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              disabled={isSubmitting || isLoading}
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.dept_name}
                </option>
              ))}
            </select>
            {errors.department && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.department}</p>
            )}
            {isLoading && (
              <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">Loading departments...</p>
            )}
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:outline-none
                ${errors.gender 
                  ? 'border-red-300 focus:ring-red-200 dark:border-red-700' 
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-200 dark:focus:ring-blue-900/30'
                }
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              disabled={isSubmitting}
            >
              <option value="">Select Gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
            {errors.gender && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.gender}</p>
            )}
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="makeAdmin"
              name="makeAdmin"
              checked={formData.makeAdmin}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isSubmitting}
            />
            <label htmlFor="makeAdmin" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Make this user an admin
            </label>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default CreateUserForm;