import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { 
  Form, 
  FormField, 
  FormLabel, 
  FormInput,
  FormSelect,
  FormSubmit,
  FormError,
  FormSuccess,
  FormSection
} from '../../components/ui/form';
import { 
  HiOutlineMail, 
  HiOutlineLockClosed, 
  HiOutlineUserCircle,
  HiOutlinePhone,
  HiOutlineOfficeBuilding 
} from 'react-icons/hi';

// Use the same API_URL constant as elsewhere in the app
const API_URL = 'http://localhost:8080/api';

function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    centerId: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [centers, setCenters] = useState([]);
  const [isLoadingCenters, setIsLoadingCenters] = useState(false);
  
  const { register, error } = useAuth();
  const navigate = useNavigate();

  // Fetch centers from the backend
  useEffect(() => {
    const fetchCenters = async () => {
      setIsLoadingCenters(true);
      try {
        const response = await axios.get(`${API_URL}/centers`);
        console.log('Centers response:', response.data);
        
        // Check if the response is an array or has content property
        if (Array.isArray(response.data)) {
        setCenters(response.data);
        } else if (response.data && response.data.content) {
          setCenters(response.data.content);
        } else {
          setCenters([]);
          console.error('Unexpected centers data format:', response.data);
        }
      } catch (err) {
        console.error('Error fetching centers:', err);
        if (err.response) {
          console.error('Error response:', err.response.status, err.response.data);
        }
        setErrors(prev => ({
          ...prev,
          centers: 'Failed to load centers. Please refresh and try again.'
        }));
      } finally {
        setIsLoadingCenters(false);
      }
    };

    fetchCenters();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    const newErrors = {};
    
    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Phone number validation
    if (formData.phoneNumber && !/^\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be 10 digits';
    }
    
    // Center validation
    if (!formData.centerId) {
      newErrors.centerId = 'Please select a center';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // We're intentionally omitting the role field because it will be set to STUDENT
      // in the AuthContext's register function
      const { confirmPassword, ...registrationData } = formData;
      
      await register(registrationData);
      setSuccess(true);
      
      // Redirect to login page after successful registration
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Registration error:', err);
      
      // Set a more user-friendly error message
      if (err.response) {
        if (err.response.status === 400) {
          // For validation errors on specific fields
          if (err.response.data && typeof err.response.data === 'object') {
            const serverErrors = {};
            Object.entries(err.response.data).forEach(([key, value]) => {
              serverErrors[key] = value;
            });
            setErrors(prev => ({ ...prev, ...serverErrors }));
          } else {
            setErrors(prev => ({ 
              ...prev, 
              server: err.response.data?.message || 'Invalid registration data'
            }));
          }
        } else if (err.response.status === 409) {
          setErrors(prev => ({ 
            ...prev, 
            email: 'This email is already registered. Please use a different email or try to login.'
          }));
        } else if (err.response.status === 500) {
          setErrors(prev => ({ 
            ...prev, 
            server: 'Server error. Please try again later or contact support.'
          }));
        } else {
          setErrors(prev => ({ 
            ...prev, 
            server: err.response.data?.message || 'An error occurred during registration.'
          }));
        }
      } else if (err.request) {
        setErrors(prev => ({ 
          ...prev, 
          server: 'Unable to connect to the server. Please check your internet connection.'
        }));
      } else {
        setErrors(prev => ({ 
          ...prev, 
          server: 'An unexpected error occurred. Please try again.'
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-100 dark:bg-gray-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          <h2 className="mt-6 text-center text-3xl font-extrabold">
            Join Workstation Reservation System
        </h2>
        </div>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Create an account to start reserving your workstations
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-lg sm:rounded-xl sm:px-10 border border-gray-200 dark:border-gray-700">
          {success && <FormSuccess>Registration successful! Redirecting to login...</FormSuccess>}
          {error && <FormError>{error}</FormError>}

          <Form onSubmit={handleSubmit} className="space-y-8">
            {errors.server && <FormError>{errors.server}</FormError>}

            <FormSection title="Personal Information">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <FormField error={errors.firstName}>
                  <FormLabel htmlFor="firstName" required>First name</FormLabel>
                  <FormInput
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={handleChange}
                    icon={HiOutlineUserCircle}
                    error={!!errors.firstName}
                  />
                </FormField>

                <FormField error={errors.lastName}>
                  <FormLabel htmlFor="lastName" required>Last name</FormLabel>
                  <FormInput
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={handleChange}
                    icon={HiOutlineUserCircle}
                    error={!!errors.lastName}
                  />
                </FormField>
            </div>

              <FormField error={errors.email}>
                <FormLabel htmlFor="email" required>Email address</FormLabel>
                <FormInput
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  icon={HiOutlineMail}
                  placeholder="your.email@example.com"
                  error={!!errors.email}
                />
              </FormField>

              <FormField error={errors.phoneNumber}>
                <FormLabel htmlFor="phoneNumber">Phone number (10 digits)</FormLabel>
                <FormInput
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  icon={HiOutlinePhone}
                  placeholder="1234567890"
                  error={!!errors.phoneNumber}
                />
              </FormField>
            </FormSection>
            
            <FormSection title="Account Information">
              <FormField error={errors.centerId || errors.centers}>
                <FormLabel htmlFor="centerId" required>Your center</FormLabel>
                <FormSelect
                  id="centerId"
                  name="centerId"
                  value={formData.centerId}
                  onChange={handleChange}
                  error={!!errors.centerId || !!errors.centers}
                  disabled={isLoadingCenters}
                >
                  <option value="">Select a center</option>
                  {centers.map(center => (
                    <option key={center.id} value={center.id}>
                      {center.name} - {center.city}
                    </option>
                  ))}
                </FormSelect>
                {isLoadingCenters && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <svg className="animate-spin mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading centers...
                  </p>
                )}
              </FormField>

              <FormField error={errors.password}>
                <FormLabel htmlFor="password" required>Password</FormLabel>
                <FormInput
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  icon={HiOutlineLockClosed}
                  error={!!errors.password}
                />
              </FormField>

              <FormField error={errors.confirmPassword}>
                <FormLabel htmlFor="confirmPassword" required>Confirm password</FormLabel>
                <FormInput
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  icon={HiOutlineLockClosed}
                  error={!!errors.confirmPassword}
                />
              </FormField>
            </FormSection>

            <FormSubmit
              isLoading={isSubmitting}
              loadingText="Creating account..."
              className="bg-gradient-to-r from-brand-primary to-brand-light hover:from-brand-hover hover:to-brand-primary"
            >
              Create account
            </FormSubmit>
          </Form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register; 