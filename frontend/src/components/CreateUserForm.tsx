import { useState } from 'react';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { getRoles, makeUserAdmin } from '../api/admin';

// Form schema validation
const userSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  makeAdmin: z.boolean().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

// API function to create a user
const createUser = async (userData: Omit<UserFormData, 'makeAdmin'>) => {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    throw new Error('Failed to create user');
  }

  return response.json();
};

interface CreateUserFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CreateUserForm = ({ onSuccess, onCancel }: CreateUserFormProps) => {
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    fullName: '',
    makeAdmin: false,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
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
      const { username, email, password, fullName, makeAdmin } = formData;
      const userData = { username, email, password, full_name: fullName };
      
      const newUser = await createUser(userData);
      
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
    } catch (error) {
      console.error('Error creating user:', error);
      setSubmitError('Failed to create user. Please try again.');
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
            <input
              type="password"
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
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default CreateUserForm; 