import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import InteractiveHoverButton from '../../components/ui/InteractiveHoverButton';
import { 
  Form, 
  FormField, 
  FormLabel, 
  FormInput, 
  FormSubmit,
  FormError
} from '../../components/ui/form';
import { HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi';
// Import logo assets
// Use the image from backend uploads directory
const loginImage = 'http://localhost:8080/uploads/workstations/logl.png';
import logoWeb4Jobs from '../../Assets/LOGO-WEB4JOBS-Jobintech.png';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, error } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
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
      const user = await login(email, password);
      // Redirect based on role
      if (user.role === 'STUDENT') {
        navigate('/dashboard');
      } else {
        // For admin or staff roles
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Set a more user-friendly error message
      if (err.response) {
        if (err.response.status === 401) {
          setErrors({
            auth: 'Invalid email or password. Please try again.'
          });
        } else if (err.response.status === 500) {
          setErrors({
            auth: 'Server error. Please try again later or contact support.'
          });
        } else {
          setErrors({
            auth: err.response.data?.message || 'An error occurred during login.'
          });
        }
      } else if (err.request) {
        setErrors({
          auth: 'Unable to connect to the server. Please check your internet connection.'
        });
      } else {
        setErrors({
          auth: 'An unexpected error occurred. Please try again.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full flex bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Left side - Image */}
        <div className="w-1/2 p-8 flex items-center justify-center">
          <img 
            src={loginImage} 
            alt="WorkstationOS" 
            className="w-full h-auto max-w-lg rounded-2xl shadow-lg"
            onError={(e) => {
              console.log('Image failed to load, using fallback');
              e.target.style.display = 'none';
            }}
          />
        </div>
        
        {/* Right side - Login Form */}
        <div className="w-1/2 p-12 flex flex-col justify-center">
          <div className="mb-8">
            {/* Web4Jobs Logo */}
            <div className="flex justify-center mb-6">
              <img 
                src={logoWeb4Jobs} 
                alt="Web4Jobs Logo" 
                className="h-12 w-auto"
              />
            </div>
            
            <div className="flex space-x-8 mb-8">
              <button className="text-brand-primary font-semibold text-lg border-b-2 border-brand-primary pb-2">
                Sign In
              </button>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Sign in to access your workstation reservations
            </p>
          </div>

          <div className="space-y-6">
            {error && <FormError>{error}</FormError>}

            <Form onSubmit={handleSubmit} className="space-y-6">
              {errors.auth && <FormError>{errors.auth}</FormError>}
              
              <FormField error={errors.email}>
                <FormLabel htmlFor="email" required>Email address</FormLabel>
                <FormInput
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={HiOutlineMail}
                  placeholder="Enter your email address"
                  error={!!errors.email}
                />
              </FormField>

              <FormField error={errors.password}>
                <FormLabel htmlFor="password" required>Password</FormLabel>
                <FormInput
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={HiOutlineLockClosed}
                  placeholder="Enter your password"
                  error={!!errors.password}
                />
              </FormField>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <a href="#" className="font-medium text-brand-primary hover:text-brand-hover">
                    Forgot your password?
                  </a>
                </div>
              </div>

              <FormSubmit
                isLoading={isSubmitting}
                loadingText="Signing in..."
                className="w-full bg-brand-primary hover:bg-brand-hover text-white py-3 text-lg font-semibold"
              >
                Sign in
              </FormSubmit>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;