import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { z } from 'zod';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

// Extend window interface for our timeout
declare global {
  interface Window {
    validateTimeout?: NodeJS.Timeout;
  }
}

// Create Zod schema matching backend validation
const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long")
    .max(50, "Username must be at most 50 characters long")
    .trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password must be at most 100 characters long"),
  confirm_password: z.string().min(1, "Confirm password is required"),
  email: z.string().email("Invalid email address").trim(),
  first_name: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be at most 50 characters long")
    .trim(),
  last_name: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be at most 50 characters long")
    .trim(),
  contact_number: z
    .string()
    .regex(
      /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
      "Invalid phone number format"
    )
    .optional()
    .or(z.literal('')),
  department: z
    .string()
    .min(1, "Department is required")
    .trim()
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

// Add field error state tracking
interface FormErrors {
  [key: string]: string[];
}

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirm_password: '',
    email: '',
    first_name: '',
    last_name: '',
    contact_number: '',
    department: ''
  });
  const [validationErrors, setValidationErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<{[key: string]: boolean}>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Mark field as touched when changed
    if (!touchedFields[name]) {
      setTouchedFields({ ...touchedFields, [name]: true });
    }
      
    // Clear any existing timeout
    if (window.validateTimeout) {
      clearTimeout(window.validateTimeout);
    }
      
    window.validateTimeout = setTimeout(() => {
      // Only validate if the field has a value or has been touched
      if (value || touchedFields[name]) {
        const errors = validateField(name, value, formData);
        
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          if (errors) {
            newErrors[name] = errors;
          } else {
            delete newErrors[name];
          }
          return newErrors;
        });
      }
      
      // For password fields, we need to validate the confirm password too
      if (name === 'password' && formData.confirm_password && touchedFields['confirm_password']) {
        const confirmErrors = validateField('confirm_password', formData.confirm_password, {...formData, [name]: value});
        
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          if (confirmErrors) {
            newErrors['confirm_password'] = confirmErrors;
          } else {
            delete newErrors['confirm_password'];
          }
          return newErrors;
        });
      }
    }, 100); // Reduced delay for more immediate feedback
  };

  // Create a more visible validation function
  const validateField = (fieldName: string, value: string, formData: any) => {
    // Skip validation for empty fields that aren't required 
    if (!value && fieldName === 'contact_number') {
      return null;
    }
    
    // Custom validation logic for each field type
    if (value) {
      // For fields that have content, do custom validation
      switch(fieldName) {
        case 'first_name':
        case 'last_name':
          // Validate names contain only letters
          return /^[A-Za-z]+$/.test(value) ? null : 
            [`${fieldName === 'first_name' ? 'First' : 'Last'} name must contain only letters`];
          
        case 'username':
          // Validate username format
          return /^[a-zA-Z0-9_]{3,}$/.test(value) ? null :
            ['Username must be at least 3 characters with only letters, numbers, and underscores'];
          
        case 'email':
          // Basic email validation
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null :
            ['Please enter a valid email address'];
          
        case 'password':
          // Password strength validation
          if (value.length < 8) {
            return ['Password must be at least 8 characters long'];
          }
          return null;
          
        case 'confirm_password':
          // Password matching validation
          return value === formData.password ? null : 
            ["Passwords don't match"];
          
        case 'contact_number':
          // Phone number validation (if provided)
          if (value && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(value)) {
            return ['Phone number must be in a valid format (e.g., 123-456-7890)'];
          }
          return null;
          
        case 'department':
          // Department validation
          return value ? null : ['Please select a department'];
      }
    } else {
      // For empty required fields
      switch(fieldName) {
        case 'first_name':
        case 'last_name':
          return ['Name is required'];
        case 'username':
          return ['Username is required'];
        case 'email':
          return ['Email is required'];
        case 'password':
          return ['Password is required'];
        case 'confirm_password':
          return ['Please confirm your password'];
        case 'department':
          return ['Please select a department'];
        default:
          return null;
      }
    }
    
    // If we reach here, validation passed
    return null;
  };

  // Validate the entire form with improved error messages
  const validateForm = () => {
    const requiredFields = ['username', 'password', 'confirm_password', 'email', 'first_name', 'last_name', 'department'];
    let isValid = true;
    const errors: FormErrors = {};
    
    // Validate each required field
    requiredFields.forEach(field => {
      const fieldValue = formData[field as keyof typeof formData] || '';
      const fieldErrors = validateField(field, fieldValue, formData);
      
      if (fieldErrors) {
        errors[field] = fieldErrors;
        isValid = false;
        
        // Mark field as touched when validation fails
        setTouchedFields(prev => ({
          ...prev,
          [field]: true
        }));
      }
    });
    
    // Validate optional fields that have values
    const optionalFields = ['contact_number'];
    optionalFields.forEach(field => {
      const fieldValue = formData[field as keyof typeof formData] || '';
      if (fieldValue) {
        const fieldErrors = validateField(field, fieldValue, formData);
        
        if (fieldErrors) {
          errors[field] = fieldErrors;
          isValid = false;
          
          // Mark field as touched when validation fails
          setTouchedFields(prev => ({
            ...prev,
            [field]: true
          }));
        }
      }
    });
    
    setValidationErrors(errors);
    return isValid;
  };

  // Add function to handle field blur with immediate validation
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Mark field as touched when blurred
    if (!touchedFields[name]) {
      setTouchedFields({ ...touchedFields, [name]: true });
    }
    
    // Only validate if the field has been touched
    if (touchedFields[name]) {
      const errors = validateField(name, value, formData);
      
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        if (errors) {
          newErrors[name] = errors;
        } else {
          delete newErrors[name];
        }
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    // Mark all fields as touched when form is submitted
    const allTouched = Object.keys(formData).reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as {[key: string]: boolean});
    
    setTouchedFields(allTouched);
    
    // Validate form with Zod
    if (!validateForm()) {
      return;
    }
    
    try {
      // Combine first and last name for backend compatibility
      const userData = {
        username: formData.username,
        password: formData.password,
        confirm_password: formData.confirm_password,
        email: formData.email,
        full_name: `${formData.first_name} ${formData.last_name}`.trim(),
        contact_number: formData.contact_number,
        // Add department to metadata or custom fields if backend supports it
        department: formData.department
      };
      
      console.log('About to register with data:', userData);
      await register(userData);
      console.log('Registration successful, navigating to dashboard');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      // Error is handled in the auth store
      console.error('Registration error in component:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
  };

  const getFieldError = (fieldName: string) => {
    return validationErrors[fieldName] ? validationErrors[fieldName][0] : null;
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Update errorMessageStyle with better visibility
  const errorMessageStyle = "mt-1 text-xs font-medium text-red-600 dark:text-red-400 flex items-center bg-red-50 dark:bg-red-900/20 p-1 rounded";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
      <div className="relative w-full max-w-md">
        {/* 3D background effects */}
        <div className="absolute -z-10 inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-400/20 to-indigo-400/20 dark:from-violet-800/20 dark:to-indigo-800/20 rounded-2xl sm:rounded-3xl blur-2xl sm:blur-3xl" />
          <div className="absolute top-0 right-0 w-48 sm:w-72 h-48 sm:h-72 bg-purple-400/30 dark:bg-purple-800/30 rounded-full mix-blend-multiply filter blur-xl sm:blur-2xl opacity-70 animate-float" />
          <div className="absolute bottom-0 left-0 w-48 sm:w-72 h-48 sm:h-72 bg-blue-400/30 dark:bg-blue-800/30 rounded-full mix-blend-multiply filter blur-lg sm:blur-xl opacity-70 animate-float" style={{ animationDelay: '-3s' }} />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 relative z-10"
        >
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Create Account</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Sign up to get started</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-lg mb-6 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-4">
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                autoComplete="given-name"
                required
                className={`mt-1 block w-full px-3 py-2 border ${
                  validationErrors.first_name ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                value={formData.first_name}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {validationErrors.first_name && touchedFields.first_name && (
                <p className={errorMessageStyle}>
                  <span className="mr-1">⚠️</span>
                  {validationErrors.first_name}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                autoComplete="family-name"
                required
                className={`mt-1 block w-full px-3 py-2 border ${
                  validationErrors.last_name ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                value={formData.last_name}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {validationErrors.last_name && touchedFields.last_name && (
                <p className={errorMessageStyle}>
                  <span className="mr-1">⚠️</span>
                  {validationErrors.last_name}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`mt-1 block w-full px-3 py-2 border ${
                  validationErrors.email ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {validationErrors.email && touchedFields.email && (
                <p className={errorMessageStyle}>
                  <span className="mr-1">⚠️</span>
                  {validationErrors.email}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className={`mt-1 block w-full px-3 py-2 border ${
                  validationErrors.username ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                value={formData.username}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {validationErrors.username && touchedFields.username && (
                <p className={errorMessageStyle}>
                  <span className="mr-1">⚠️</span>
                  {validationErrors.username}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                id="contact_number"
                name="contact_number"
                type="tel"
                autoComplete="tel"
                required
                className={`mt-1 block w-full px-3 py-2 border ${
                  validationErrors.contact_number ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                value={formData.contact_number}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {validationErrors.contact_number && touchedFields.contact_number && (
                <p className={errorMessageStyle}>
                  <span className="mr-1">⚠️</span>
                  {validationErrors.contact_number}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                Department
              </label>
              <select
                id="department"
                name="department"
                required
                className={`mt-1 block w-full px-3 py-2 border ${
                  validationErrors.department ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                value={formData.department}
                onChange={handleChange}
                onBlur={handleBlur}
                style={{ 
                  backgroundColor: 'white',
                  color: '#374151'
                }}
              >
                <option value="" style={{ backgroundColor: '#f3f4f6', fontWeight: 'bold' }}>Select a department</option>
                <option value="HR" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>Human Resources</option>
                <option value="IT" style={{ backgroundColor: '#f0fdf4', color: '#166534' }}>Information Technology</option>
                <option value="Finance" style={{ backgroundColor: '#eff6ff', color: '#1e40af' }}>Finance & Accounting</option>
                <option value="Marketing" style={{ backgroundColor: '#fef2f2', color: '#b91c1c' }}>Marketing & Communications</option>
                <option value="Operations" style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}>Operations & Logistics</option>
                <option value="Sales" style={{ backgroundColor: '#fdf2f8', color: '#9d174d' }}>Sales & Business Development</option>
                <option value="RnD" style={{ backgroundColor: '#ecfdf5', color: '#065f46' }}>Research & Development</option>
                <option value="Legal" style={{ backgroundColor: '#f5f3ff', color: '#5b21b6' }}>Legal & Compliance</option>
                <option value="Customer" style={{ backgroundColor: '#fff7ed', color: '#c2410c' }}>Customer Support</option>
                <option value="Admin" style={{ backgroundColor: '#f0f9ff', color: '#0369a1' }}>Administration</option>
                <option value="Executive" style={{ backgroundColor: '#fafafa', color: '#171717' }}>Executive Leadership</option>
                <option value="Product" style={{ backgroundColor: '#f0fdfa', color: '#0f766e' }}>Product Management</option>
              </select>
              {validationErrors.department && touchedFields.department && (
                <p className={errorMessageStyle}>
                  <span className="mr-1">⚠️</span>
                  {validationErrors.department}
                </p>
              )}
            </div>

            <div className="mb-4 relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className={`mt-1 block w-full px-3 py-2 border ${
                    validationErrors.password ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
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
              {validationErrors.password && touchedFields.password && (
                <p className={errorMessageStyle}>
                  <span className="mr-1">⚠️</span>
                  {validationErrors.password}
                </p>
              )}
            </div>

            <div className="mb-4 relative">
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className={`mt-1 block w-full px-3 py-2 border ${
                    validationErrors.confirm_password ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  value={formData.confirm_password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {validationErrors.confirm_password && touchedFields.confirm_password && (
                <p className={errorMessageStyle}>
                  <span className="mr-1">⚠️</span>
                  {validationErrors.confirm_password}
                </p>
              )}
            </div>
            
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-2 sm:py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-70 text-sm sm:text-base mt-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </motion.button>
            
            <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Register; 